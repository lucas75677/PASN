async function fetchContent(url) {
  const localCache = await checkLocalCache(url);
  if (localCache) {
    return localCache;
  }
  
  const peerData = await findFromPeers(url);
  if (peerData) {
    return peerData;
  }

  const serverData = await fetchFromServer(url);
  if (!serverData) {
    throw new Error("Servidor não encontrado.");
  }

  return serverData;
}

async function checkLocalCache(url) {
  // Verifica se o conteúdo está no cache local
  return localStorage.getItem(url);
}

async function findFromPeers(url) {
  // Procura dados em outros usuários conectados
  return await webRTCRequest(url);
}

async function fetchFromServer(url) {
  // Faz requisição ao servidor original
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    return null;
  }
}
function streamVideo(url) {
  const chunkSize = 10 * 1024 * 1024; // 10MB por chunk
  const peers = getPeersConnected(); // Lista de usuários conectados

  fetch(url)
    .then(response => response.body)
    .then(stream => {
      const reader = stream.getReader();
      let chunkIndex = 0;

      function processChunk({ done, value }) {
        if (done) return;
        
        const chunk = value.slice(0, chunkSize);
        distributeToPeers(chunk, peers, chunkIndex);
        chunkIndex++;
        reader.read().then(processChunk);
      }

      reader.read().then(processChunk);
    });
}

function distributeToPeers(chunk, peers, chunkIndex) {
  peers.forEach(peer => {
    sendToPeer(peer, { chunk, index: chunkIndex });
  });
}
function maskIP(request) {
  const encryptedData = encryptData(request.body);
  return {
    ...request,
    body: encryptedData,
    maskedIP: generateRandomIP(),
  };
}

function encryptData(data) {
  // Criptografia básica (melhor usar AES)
  return btoa(data);
}

function generateRandomIP() {
  return ${random(1, 255)}.${random(1, 255)}.${random(1, 255)}.${random(1, 255)};
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}