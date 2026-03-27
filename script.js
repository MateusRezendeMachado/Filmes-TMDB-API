// CONFIGURAÇÕES API TMDB
const urlBaseFilmes = "https://api.themoviedb.org/3/movie/popular?language=pt-BR";
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

// ESTADO DA PAGINAÇÃO 
let paginaAtual = 1;
let totalPaginas = 1;
let listaGeneros = [];


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

// FUNÇÃO PARA BUSCAR GÊNEROS
async function buscarGeneros() {
    const resposta = await fetch(urlGeneros, options);

    if (!resposta.ok) {
        throw new Error(`Erro ao buscar gêneros: ${resposta.status}`);
    }

    const dados = await resposta.json();
    return dados.genres;
}

//  FUNÇÃO AUXILIAR PARA GERAR ESTRELAS
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

// ===================== ATUALIZA CONTROLES DA PAGINAÇÃO =====================
function atualizarPaginacao() {
    pageInfo.textContent = `Página ${paginaAtual}`;
    prevBtn.disabled = paginaAtual === 1;
    nextBtn.disabled = paginaAtual === totalPaginas;
}

// ===================== CARREGAR FILMES DA PÁGINA ATUAL =====================
async function carregarFilmes(pagina = 1) {
    try {
        catalogoDiv.innerHTML = `<p style="text-align:center; padding:2rem;">Carregando filmes...</p>`;

        const respostaFilmes = await fetch(`${urlBaseFilmes}&page=${pagina}`, options);

        if (!respostaFilmes.ok) {
            throw new Error(`Erro TMDB: ${respostaFilmes.status}`);
        }

        const dadosFilmes = await respostaFilmes.json();

        paginaAtual = dadosFilmes.page;
        totalPaginas = dadosFilmes.total_pages;

        if (listaGeneros.length === 0) {
            listaGeneros = await buscarGeneros();
        }

        const filmes = dadosFilmes.results.slice(0, 10);

        catalogoDiv.innerHTML = "";

        filmes.forEach(filme => {
            const nomesGeneros = filme.genre_ids.map(id => {
                const genero = listaGeneros.find(g => g.id === id);
                return genero ? genero.name : "Desconhecido";
            });

            const nota = filme.vote_average.toFixed(1);

            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
        <img src="${filme.poster_path ? urlImagem + filme.poster_path : "https://via.placeholder.com/500x750?text=Sem+Poster"}" alt="${filme.title}" loading="lazy">
        <div class="card-content">
          <h2>${filme.title}</h2>
          <div class="generos">
            ${nomesGeneros.map(g => `<span>${g}</span>`).join("")}
          </div>
          <div class="rating">
            ${gerarEstrelas(filme.vote_average)} <span>${nota} / 10</span>
          </div>
        </div>
      `;

            card.addEventListener("click", () => {
                abrirModal(filme, listaGeneros);
            });

            catalogoDiv.appendChild(card);
        });

        atualizarPaginacao();
        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (erro) {
        console.error("Erro ao carregar filmes:", erro);
        catalogoDiv.innerHTML = `
      <p style="text-align:center; padding:2rem;">
        ❌ ${erro.message}<br>
        Verifique sua conexão ou token da API.
      </p>
    `;
    }
}

// ===================== FUNÇÃO PARA ABRIR MODAL COM INFORMAÇÕES COMPLETAS =====================
function abrirModal(filme, listaGeneros) {
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

// ===================== FECHAR MODAL =====================
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

// ===================== EVENTOS DA PAGINAÇÃO =====================
prevBtn.addEventListener("click", () => {
    if (paginaAtual > 1) {
        carregarFilmes(paginaAtual - 1);
    }
});

nextBtn.addEventListener("click", () => {
    if (paginaAtual < totalPaginas) {
        carregarFilmes(paginaAtual + 1);
    }
});

// ===================== TEMA CLARO / ESCURO =====================
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

const themeBtn = document.getElementById("themeToggle");
themeBtn.addEventListener("click", toggleTheme);
initTheme();

// ===================== INICIALIZAÇÃO =====================
carregarFilmes();
