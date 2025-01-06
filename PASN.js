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
          headers: { 'X-Encrypted': 'true' },
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

// Streaming em chunks com distribuição dinâmica
function streamVideo(url) {
  const chunkSize = 512 * 1024; // 512KB por pedaço
  const peers = getPeersConnected();

  fetch(url)
    .then(response => response.body)
    .then(stream => {
      const reader = stream.getReader();
      let chunkIndex = 0;

      async function processChunk({ done, value }) {
        if (done) return;

        const chunk = value.slice(0, chunkSize);
        const scrambledChunk = scrambleData(chunk); // Embaralha o chunk

        distributeToPeers(scrambledChunk, peers, chunkIndex); // Distribui aos peers
        chunkIndex++;

        // Monitora invasores
        if (detectIntrusion(chunk)) {
          console.warn("Invasor detectado! Reconectando...");
          return restartConnection(url); // Reinicia a conexão
        }

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

// Funções de segurança
function maskIP(request) {
  const encryptedData = encryptData(request.body);
  return {
    ...request,
    body: encryptedData,
    maskedIP: generateRandomIP(),
  };
}

function encryptData(data) {
  // AES recomendado, aqui apenas simulação
  return btoa(data);
}

function decryptData(data) {
  return atob(data);
}

function generateRandomIP() {
  return `${random(1, 255)}.${random(1, 255)}.${random(1, 255)}.${random(1, 255)}`;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// Embaralhamento e reorganização dos pacotes
function scrambleData(data) {
  const scrambled = [...data].sort(() => Math.random() - 0.5);
  return new Uint8Array(scrambled);
}

function detectIntrusion(data) {
  // Simulação de detecção de ataque (pode ser aprimorada)
  return data.some(byte => byte === 0x00); // Exemplo de byte inválido
}

function restartConnection(url) {
  console.log("Reconectando...");
  return fetchContent(url); // Reinicia o fetch
}

function generateRandomRoutes(url) {
  // Cria URLs alternativas (simulando rotas diferentes)
  const routes = [];
  for (let i = 0; i < 3; i++) {
    routes.push(`${url}?route=${generateRandomIP()}`);
  }
  return routes;
}
