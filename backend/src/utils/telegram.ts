import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SANDBOX_MODE = process.env.SANDBOX_MODE === 'true';

export async function sendTelegramNotification(message: string): Promise<boolean> {
  const logPrefix = '[Telegram Bot Notification]';
  
  if (SANDBOX_MODE || !BOT_TOKEN || BOT_TOKEN.includes('MOCK') || !CHAT_ID || CHAT_ID.includes('MOCK')) {
    console.log(`\n🔔 ${logPrefix} (SANDBOX MODE - MOCK SEND)`);
    console.log(`-------------------------------------------`);
    console.log(message);
    console.log(`-------------------------------------------\n`);
    return true;
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${logPrefix} Failed to send telegram notification:`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`${logPrefix} Error sending telegram notification:`, error);
    return false;
  }
}
