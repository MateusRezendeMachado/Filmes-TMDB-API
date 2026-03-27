// CONFIGURAÇÕES API TMDB
const urlBaseFilmes = "https://api.themoviedb.org/3/movie/popular?language=pt-BR";
const urlBaseBusca = "https://api.themoviedb.org/3/search/movie?language=pt-BR";
const urlGeneros = "https://api.themoviedb.org/3/genre/movie/list?language=pt-BR";
const urlImagem = "https://image.tmdb.org/t/p/w500";

const token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MDNmMGNiNDUzNjhhOTc1MTEzNTYyNDExMDYxODg3ZCIsIm5iZiI6MTc3NDYyNTMwOC44MzcsInN1YiI6IjY5YzZhMjFjNTZlMDA4YTlmMWM2MzE3OSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.7nvtoHnmdXm9SIZ5HqFp6D9A57fKVPQ1nfioXz4jAPE";

const options = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`
    }
};

// ESTADO DA APLICAÇÃO
let paginaAtual = 1;
let totalPaginas = 1;
let listaGeneros = [];
let modoBusca = false;
let termoBuscaAtual = "";
let debounceTimeout = null; // para controle do debounce

// ELEMENTOS DOM
const catalogoDiv = document.getElementById("catalogo");
const modalOverlay = document.getElementById("modalOverlay");
const modalPoster = document.getElementById("modalPoster");
const modalTitle = document.getElementById("modalTitle");
const modalGenresDiv = document.getElementById("modalGenres");
const modalStars = document.getElementById("modalStars");
const modalVote = document.getElementById("modalVote");
const modalRelease = document.getElementById("modalRelease");
const modalOverview = document.getElementById("modalOverview");
const closeModalBtn = document.getElementById("closeModalBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const themeBtn = document.getElementById("themeToggle");

// BUSCAR GÊNEROS
async function buscarGeneros() {
    const resposta = await fetch(urlGeneros, options);

    if (!resposta.ok) {
        throw new Error(`Erro ao buscar gêneros: ${resposta.status}`);
    }

    const dados = await resposta.json();
    return dados.genres;
}

// GERAR ESTRELAS (usando Font Awesome)
function gerarEstrelas(nota) {
    const notaEm5 = (nota / 10) * 5;
    const estrelasCheias = Math.floor(notaEm5);
    const meiaEstrela = notaEm5 % 1 >= 0.5;

    let estrelas = "";
    for (let i = 0; i < estrelasCheias; i++) estrelas += '<i class="fas fa-star"></i>';
    if (meiaEstrela) estrelas += '<i class="fas fa-star-half-alt"></i>';
    while (estrelas.split('fa-star').length - 1 < 5) estrelas += '<i class="far fa-star"></i>';
    return estrelas;
}

// ATUALIZAR PAGINAÇÃO
function atualizarPaginacao() {
    if (modoBusca) {
        pageInfo.textContent = `Busca: página ${paginaAtual}`;
    } else {
        pageInfo.textContent = `Página ${paginaAtual}`;
    }

    prevBtn.disabled = paginaAtual === 1;
    nextBtn.disabled = paginaAtual === totalPaginas || totalPaginas === 0;
}

// RENDERIZAR FILMES
function renderizarFilmes(filmes) {
    catalogoDiv.innerHTML = "";

    if (!filmes || filmes.length === 0) {
        catalogoDiv.innerHTML = `
      <p style="text-align: center; padding: 2rem;">
        Nenhum filme encontrado.
      </p>
    `;
        return;
    }

    filmes.forEach(filme => {
        const nomesGeneros = filme.genre_ids.map(id => {
            const genero = listaGeneros.find(g => g.id === id);
            return genero ? genero.name : "Desconhecido";
        });

        const nota = filme.vote_average.toFixed(1);

        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
      <img 
        src="${filme.poster_path ? urlImagem + filme.poster_path : "https://via.placeholder.com/500x750?text=Sem+Poster"}" 
        alt="${filme.title}" 
        loading="lazy"
      >
      <div class="card-content">
        <h2>${filme.title}</h2>
        <div class="generos">
          ${nomesGeneros.map(genero => `<span>${genero}</span>`).join("")}
        </div>
        <div class="rating">
          ${gerarEstrelas(filme.vote_average)} <span>${nota} / 10</span>
        </div>
      </div>
    `;

        card.addEventListener("click", () => {
            abrirModal(filme);
        });

        catalogoDiv.appendChild(card);
    });
}

// CARREGAR FILMES POPULARES
async function carregarFilmes(pagina = 1) {
    try {
        catalogoDiv.innerHTML = `
      <p style="text-align: center; padding: 2rem;">
        Carregando filmes...
      </p>
    `;

        const respostaFilmes = await fetch(`${urlBaseFilmes}&page=${pagina}`, options);

        if (!respostaFilmes.ok) {
            throw new Error(`Erro TMDB: ${respostaFilmes.status}`);
        }

        const dadosFilmes = await respostaFilmes.json();

        paginaAtual = dadosFilmes.page;
        totalPaginas = dadosFilmes.total_pages;
        modoBusca = false;

        if (listaGeneros.length === 0) {
            listaGeneros = await buscarGeneros();
        }

        const filmes = dadosFilmes.results.slice(0, 10);

        renderizarFilmes(filmes);
        atualizarPaginacao();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (erro) {
        console.error("Erro ao carregar filmes:", erro);
        catalogoDiv.innerHTML = `
      <p style="text-align: center; padding: 2rem;">
        ❌ ${erro.message}<br>
        Verifique sua conexão ou token da API.
      </p>
    `;
    }
}

// BUSCAR FILMES POR NOME
async function buscarFilmesPorNome(termo, pagina = 1) {
    try {
        catalogoDiv.innerHTML = `
      <p style="text-align: center; padding: 2rem;">
        Buscando filmes...
      </p>
    `;

        const urlBusca = `${urlBaseBusca}&query=${encodeURIComponent(termo)}&page=${pagina}`;
        const resposta = await fetch(urlBusca, options);

        if (!resposta.ok) {
            throw new Error(`Erro na busca: ${resposta.status}`);
        }

        const dados = await resposta.json();

        paginaAtual = dados.page;
        totalPaginas = dados.total_pages;
        modoBusca = true;
        termoBuscaAtual = termo;

        if (listaGeneros.length === 0) {
            listaGeneros = await buscarGeneros();
        }

        const filmes = dados.results.slice(0, 10);

        renderizarFilmes(filmes);
        atualizarPaginacao();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (erro) {
        console.error("Erro ao buscar filmes:", erro);
        catalogoDiv.innerHTML = `
      <p style="text-align: center; padding: 2rem;">
        ❌ ${erro.message}
      </p>
    `;
    }
}

// DEBOUNCE PARA BUSCA EM TEMPO REAL
function debounce(func, delay) {
    return function (...args) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// MANIPULADOR DE BUSCA EM TEMPO REAL
function handleRealTimeSearch() {
    const termo = searchInput.value.trim();

    if (termo === "") {
        carregarFilmes(1);
    } else {
        buscarFilmesPorNome(termo, 1);
    }
}

const debouncedSearch = debounce(handleRealTimeSearch, 300);

// ABRIR MODAL
function abrirModal(filme) {
    modalPoster.src = filme.poster_path
        ? urlImagem + filme.poster_path
        : "https://via.placeholder.com/300x450?text=Sem+Poster";

    modalPoster.alt = filme.title;
    modalTitle.textContent = filme.title;

    const nomesGen = filme.genre_ids.map(id => {
        const gen = listaGeneros.find(g => g.id === id);
        return gen ? gen.name : "Desconhecido";
    });

    modalGenresDiv.innerHTML = nomesGen
        .map(genre => `<span class="genre-badge">${genre}</span>`)
        .join("");

    const nota = filme.vote_average.toFixed(1);
    modalVote.textContent = `${nota} / 10 (${filme.vote_count} votos)`;
    modalStars.innerHTML = gerarEstrelas(filme.vote_average);

    const releaseDate = filme.release_date
        ? new Date(filme.release_date).toLocaleDateString("pt-BR")
        : "Data não disponível";

    modalRelease.textContent = releaseDate;

    const sinopse = filme.overview && filme.overview.trim() !== ""
        ? filme.overview
        : "Sinopse não disponível para este filme no momento.";

    modalOverview.textContent = sinopse;

    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

// FECHAR MODAL
function fecharModal() {
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        fecharModal();
    }
});

closeModalBtn.addEventListener("click", fecharModal);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
        fecharModal();
    }
});

// EVENTOS DA PAGINAÇÃO
prevBtn.addEventListener("click", () => {
    if (paginaAtual > 1) {
        if (modoBusca) {
            buscarFilmesPorNome(termoBuscaAtual, paginaAtual - 1);
        } else {
            carregarFilmes(paginaAtual - 1);
        }
    }
});

nextBtn.addEventListener("click", () => {
    if (paginaAtual < totalPaginas) {
        if (modoBusca) {
            buscarFilmesPorNome(termoBuscaAtual, paginaAtual + 1);
        } else {
            carregarFilmes(paginaAtual + 1);
        }
    }
});

// EVENTOS DA BUSCA
searchBtn.addEventListener("click", () => {
    const termo = searchInput.value.trim();

    if (termo === "") {
        carregarFilmes(1);
        return;
    }

    buscarFilmesPorNome(termo, 1);
});

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const termo = searchInput.value.trim();

        if (termo === "") {
            carregarFilmes(1);
            return;
        }

        buscarFilmesPorNome(termo, 1);
    }
});

searchInput.addEventListener("input", debouncedSearch);

// TEMA CLARO / ESCURO
function initTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    } else if (savedTheme === "light") {
        document.body.classList.remove("dark");
    } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (prefersDark) {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeBtn.addEventListener("click", toggleTheme);
initTheme();

// INICIALIZAÇÃO
carregarFilmes();
