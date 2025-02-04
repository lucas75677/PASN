async function fetchContent(url) {
  const localCache = await checkLocalCache(url);
  if (localCache) return localCache;

  const peerData = await findFromPeers(url);
  if (peerData) return peerData;

  const serverData = await fetchFromServer(url);
  if (!serverData) throw new Error("Servidor não encontrado.");

  return serverData;
}

async function checkLocalCache(url) {
  return localStorage.getItem(url);
}

async function findFromPeers(url) {
  return await webRTCRequest(url);
}

async function fetchFromServer(url) {
  try {
    const encryptedUrl = encryptData(url); // Encripta o URL
    const routes = generateRandomRoutes(url); // Roteia pacotes por caminhos diferentes

    const responses = await Promise.all(
      routes.map(route =>
        fetch(route, {
          method: "GET",
          headers: { 
            'X-Encrypted': 'true',
            'X-OS': getOS(), // Envia o nome do sistema operacional
            'X-Language': 'hidden', // Esconde o idioma do pacote
            'User-Agent': getFakeUserAgent(), // Altera o User-Agent para esconder o navegador real
          },
        })
      )
    );

    const validResponse = responses.find(res => res.ok);
    if (!validResponse) return null;

    const encryptedData = await validResponse.text();
    return decryptData(encryptedData); // Descriptografa os dados
  } catch (e) {
    return null;
  }
}

// Função para gerar um User-Agent falso
function getFakeUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)]; // Retorna um User-Agent aleatório
}

// Função para obter o sistema operacional
function getOS() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Win")) return "Windows";
  if (userAgent.includes("Mac")) return "MacOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS")) return "iOS";
  return "Unknown OS";
}

// Função para esconder promoções sensíveis
function maskSensitiveData(data) {
  const sensitivePromotions = ["promo1", "promo2", "promo3"]; // Exemplo de promoções sensíveis
  let maskedData = data;
  sensitivePromotions.forEach(promo => {
    maskedData = maskedData.replace(new RegExp(promo, "g"), "*****"); // Substitui promoções por "*****"
  });
  return maskedData;
}

// Função para apagar o chunk após enviar
function deleteChunkAfterSend(chunk) {
  console.log("Chunk enviado e apagado.");
  chunk = null; // Simula a exclusão do chunk
}
