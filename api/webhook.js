const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const SMS_MESSAGE = "Thanks for calling Moses Roses! Browse our menu, check out today's deals, and order for pickup at mosesroses.com - Stop and Smell the Roses!";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const event = req.body;
    if (event.event !== "call_ended" && event.event !== "call_analyzed") {
      return res.status(200).json({ status: "ignored" });
    }
    const callerNumber = event.call?.from_number || event.call?.to_number || null;
    if (!callerNumber) {
      return res.status(200).json({ status: "skipped", reason: "no phone number" });
    }
    const callDuration = event.call?.duration_ms || 0;
    if (callDuration < 5000) {
      return res.status(200).json({ status: "skipped", reason: "call too short" });
    }
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: callerNumber,
        Body: SMS_MESSAGE,
      }),
    });
    const twilioData = await twilioResponse.json();
    if (twilioResponse.ok) {
      return res.status(200).json({ status: "sent", to: callerNumber, sid: twilioData.sid });
    } else {
      return res.status(200).json({ status: "error", error: twilioData.message });
    }
  } catch (error) {
    return res.status(200).json({ status: "error", error: error.message });
  }
}
