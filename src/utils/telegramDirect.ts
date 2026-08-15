// Client-side Direct Telegram Dispatcher
// Works seamlessly even on Vercel static deployments or when backend is unavailable

export interface DirectTelegramResult {
  success: boolean;
  message: string;
  error?: string;
}

export function cleanToken(token: string): string {
  if (!token) return '';
  let cleaned = token.trim();
  if (cleaned.toLowerCase().startsWith('bot')) {
    cleaned = cleaned.substring(3).trim();
  }
  return cleaned;
}

export function cleanChatId(chatId: string): string {
  if (!chatId) return '';
  return chatId.trim();
}

export function stripHtml(str: string): string {
  if (!str) return '';
  return String(str).replace(/<[^>]*>?/gm, '');
}

export async function sendTelegramDirect(
  token: string,
  chatId: string,
  messageText: string
): Promise<DirectTelegramResult> {
  const cleanedToken = cleanToken(token);
  const cleanedChatId = cleanChatId(chatId);

  if (!cleanedToken || !cleanedChatId) {
    return {
      success: false,
      message: 'กรุณากรอก Telegram Bot Token และ Chat ID ให้ครบถ้วน',
    };
  }

  const url = `https://api.telegram.org/bot${cleanedToken}/sendMessage`;

  try {
    // 1st attempt: HTML formatted
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanedChatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    let data = await response.json();

    // If HTML format parsing failed, retry with plain text
    if (!data.ok && data.description && data.description.toLowerCase().includes('parse')) {
      console.warn('[TelegramDirect] HTML parse failed, falling back to plain text:', data.description);
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: cleanedChatId,
          text: stripHtml(messageText),
        }),
      });
      data = await response.json();
    }

    if (data.ok) {
      return {
        success: true,
        message: 'ส่งข้อความแจ้งเตือนเข้า Telegram สำเร็จเรียบร้อยแล้ว',
      };
    } else {
      let desc = data.description || 'เกิดข้อผิดพลาดในการส่งข้อความ';
      if (desc.includes('Unauthorized') || desc.includes('invalid token')) {
        desc = 'Bot Token ไม่ถูกต้อง กรุณาตรวจสอบ Token จาก @BotFather';
      } else if (desc.includes('chat not found') || desc.includes('chat_id_invalid')) {
        desc = 'ไม่พบ Chat ID กรุณาดึงบอทเข้ากลุ่ม/แชแนลและตั้งค่าให้เป็น Admin';
      } else if (desc.includes('rights') || desc.includes('administrator')) {
        desc = 'บอทไม่มีสิทธิ์ส่งข้อความในกลุ่ม กรุณาตั้งค่าบอทเป็น Admin';
      }
      return {
        success: false,
        message: desc,
        error: data.description,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'ไม่สามารถเชื่อมต่อกับ Telegram API ได้',
      error: String(err),
    };
  }
}
