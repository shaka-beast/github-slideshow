const base = process.env.DARAJA_BASE_URL!
const key = process.env.DARAJA_CONSUMER_KEY!
const secret = process.env.DARAJA_CONSUMER_SECRET!
const shortCode = process.env.DARAJA_SHORT_CODE!
const passkey = process.env.DARAJA_PASSKEY!

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64') },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Daraja token error')
  const json = await res.json()
  return json.access_token as string
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export async function initiateStkPush({ phone, amountKes, accountRef, callbackUrl }: { phone: string; amountKes: number; accountRef: string; callbackUrl: string; }) {
  const token = await getAccessToken()
  const ts = timestamp()
  const password = Buffer.from(shortCode + passkey + ts).toString('base64')
  const body = {
    BusinessShortCode: Number(shortCode),
    Password: password,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amountKes,
    PartyA: phone,
    PartyB: Number(shortCode),
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: accountRef,
    TransactionDesc: 'Okolea Donation',
  }
  const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: { CheckoutRequestID?: string; MerchantRequestID?: string; errorCode?: string } = await res.json()
  if (!res.ok || json.errorCode) {
    throw new Error('STK push failed: ' + JSON.stringify(json))
  }
  return json
}

