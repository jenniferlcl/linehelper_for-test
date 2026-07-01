export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    service: "line-00402a-bot",
    time: new Date().toISOString()
  });
}
