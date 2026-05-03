# Twilio A2P 10DLC Campaign Resubmission Packet

**Status:** Ready to submit. Marc to paste into Twilio Console.
**Console path:** Messaging → Compliance → US A2P 10DLC → Campaigns → (rejected campaign) → Edit / Resubmit
**Original rejection:** Error 30909 — "Call to Action (CTA) provided for the campaign could not be verified"
**Root cause:** No publicly accessible URL showed the consent mechanism at submission time.
**Fix:** `/sms-consent` is now live at `https://app.forbetra.com/sms-consent` and shows the entire opt-in flow, frequency, STOP/HELP keywords, costs disclosure, and business address.

---

## Field-by-field paste sheet

### Campaign Use Case

**Mixed** (covers reminders + notifications + 360 invitations)

### Campaign Description

> Forbetra sends transactional notifications to professional coaching users who have explicitly opted in via their account settings. Messages include weekly self-reflection check-in reminders, notifications when a 360-degree reviewer submits feedback, coaching session prep prompts, and invitations to provide reviewer feedback. Users actively select "SMS" or "Both" as their delivery method and provide their mobile number — SMS is never the default and is not required to use the platform. Consent is captured per-account and can be revoked at any time by replying STOP or by changing delivery method back to Email in settings.

### Call-to-Action (Opt-in Mechanism) — THIS IS THE FIELD THAT CAUSED REJECTION

> Users opt in inside the authenticated Forbetra web application at https://app.forbetra.com. In their notification settings, they choose "SMS" or "Both" as their delivery method and enter a mobile phone number. The settings UI displays consent disclosure language directly above the choice: "By enabling SMS, you agree to receive automated text messages from Forbetra. ~1–4 msgs/week. Msg & data rates may apply. Reply STOP to opt out." with links to SMS Terms and Privacy Policy.
>
> A public-facing description of the consent flow, including a visual reproduction of the in-app opt-in UI, is available at: **https://app.forbetra.com/sms-consent**
>
> The full SMS terms are at: **https://app.forbetra.com/sms-terms**
>
> The privacy policy is at: **https://app.forbetra.com/privacy**

### Message Flow / Sample Opt-in Text

The opt-in is collected via web form, not SMS. After a user selects SMS delivery and saves their phone number, no confirmation SMS is sent before they begin receiving the operational messages described above.

### Sample Messages (use the actual templates)

1. **Check-in reminder:** "Forbetra: Time for your weekly check-in. Takes about 90 seconds → https://app.forbetra.com/individual/checkin Reply STOP to opt out."
2. **Reviewer invitation:** "Forbetra: {ClientName} has asked you for 360-degree feedback. Submit here: {link} Reply STOP to opt out."
3. **Stakeholder feedback received:** "Forbetra: New feedback from a reviewer is in. View it: https://app.forbetra.com/individual/insights Reply STOP to opt out."
4. **Coach session prep:** "Forbetra: Your coaching prep for {ClientName} is ready: {link} Reply STOP to opt out."

### Opt-in Keywords

N/A — opt-in is web-based, not SMS-based.

### Opt-out Keywords

STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT

### Opt-out Message

"You have been unsubscribed from Forbetra SMS messages. No further messages will be sent. Reply START to resubscribe."

### Help Keywords

HELP, INFO

### Help Message

"Forbetra SMS Help: 1–4 msgs/week. Msg & data rates may apply. Email sagal@thewinningmind.com or visit https://app.forbetra.com/sms-consent. Reply STOP to opt out."

### Number of Sample Messages

4

### Subscriber Opt-in

☑ Yes — captured in account settings

### Subscriber Opt-out

☑ Yes — STOP keyword + settings toggle

### Subscriber Help

☑ Yes — HELP keyword + email contact

### Embedded Links

☑ Yes — links to authenticated app routes (check-in, insights, feedback submission)

### Embedded Phone Numbers

☐ No

### Affiliate Marketing

☐ No

### Age-Gated Content

☐ No

### Direct Lending

☐ No

---

## Cleanup tasks (do while in Twilio Console)

These are from `docs/session-prep-feb27.md` and should be done in the same session to avoid future confusion:

1. **Release unused number** `+1 (619) 648-1113` — not referenced in code, costs ~$1/mo
2. **Delete unused messaging service** "Forbetra" (`MG2127...`) — keep only "Low Volume Mixed A2P" (`MG1f82...`)
3. After resubmission is approved, send a single test SMS to a Marc number to confirm `error 30034` is gone

---

## Verification checklist before clicking Submit

- [ ] `https://app.forbetra.com/sms-consent` loads in an incognito window (verified live, HTTP 200)
- [ ] `https://app.forbetra.com/sms-terms` loads in an incognito window (verified live, HTTP 200)
- [ ] Brand registration still shows **Approved** in Twilio Console
- [ ] Paste the CTA field exactly as written above — that field's wording is what was rejected last time
