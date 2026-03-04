export default async function handler(req, res) {
  const { q } = req.query;
  const apiKey = process.env.REACT_APP_NEWS_API_KEY;

  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
  );

  const data = await response.json();
  res.status(200).json(data);
}