// ============================================================
//  LOJA.JS — lógica da loja (index.html)
// ============================================================

// ---------- CARRINHO UI ----------
function atualizarBadgeCarrinho() {
  const n = DB.Carrinho.count();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

function adicionarCarrinho(id) {
  const produto = DB.Produtos.porId(id);
  if (!produto) return;
  DB.Carrinho.adicionar(produto);
  atualizarBadgeCarrinho();
  renderCarrinho();
  mostrarToast(`${produto.emoji} ${produto.nome} adicionado ao carrinho!`);
}

function removerItemCarrinho(id) {
  DB.Carrinho.remover(id);
  atualizarBadgeCarrinho();
  renderCarrinho();
}

function alterarQtyCarrinho(id, delta) {
  const itens = DB.Carrinho.itens();
  const item  = itens.find(i => i.id === id);
  if (!item) return;
  DB.Carrinho.alterarQty(id, item.qty + delta);
  atualizarBadgeCarrinho();
  renderCarrinho();
}

function renderCarrinho() {
  const itens      = DB.Carrinho.itens();
  const subtotal   = DB.Carrinho.subtotal();
  const frete      = subtotal >= 150 ? 0 : 15.90;
  const total      = subtotal + frete;
  const listaEl    = document.getElementById('carrinhoItens');
  const vazioEl    = document.getElementById('carrinhoVazio');
  const conteudoEl = document.getElementById('carrinhoConteudo');
  const checkoutEl = document.getElementById('checkoutBox');
  const concluidoEl= document.getElementById('pedidoConcluido');

  if (!listaEl) return;

  if (itens.length === 0) {
    vazioEl.style.display    = 'flex';
    conteudoEl.style.display = 'none';
    checkoutEl.style.display = 'none';
    concluidoEl.style.display= 'none';
    return;
  }

  vazioEl.style.display    = 'none';
  conteudoEl.style.display = 'grid';
  checkoutEl.style.display = 'none';

  listaEl.innerHTML = itens.map(item => `
    <div class="item-carr">
      <div class="item-emoji">${item.emoji}</div>
      <div class="item-info">
        <h4>${item.nome}</h4>
        <span class="item-preco-unit">R$ ${fmt(item.preco)}</span>
      </div>
      <div class="item-qty">
        <button onclick="alterarQtyCarrinho('${item.id}', -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="alterarQtyCarrinho('${item.id}', +1)">+</button>
      </div>
      <div class="item-subtotal">
        <strong>R$ ${fmt(item.preco * item.qty)}</strong>
        <button class="btn-remover" onclick="removerItemCarrinho('${item.id}')">Remover</button>
      </div>
    </div>
  `).join('');

  document.getElementById('resumoSubtotal').textContent = 'R$ ' + fmt(subtotal);
  document.getElementById('resumoFrete').textContent    = frete === 0 ? 'Grátis' : 'R$ ' + fmt(frete);
  document.getElementById('resumoTotal').textContent    = 'R$ ' + fmt(total);
  document.getElementById('resumoFrete').className      = frete === 0 ? 'verde' : '';

  const avisoEl = document.getElementById('avisoFrete');
  if (frete === 0) {
    avisoEl.className = 'aviso-frete aviso-verde';
    avisoEl.textContent = '🎉 Você ganhou frete grátis!';
  } else {
    avisoEl.className = 'aviso-frete aviso-muted';
    avisoEl.textContent = `Faltam R$ ${fmt(150 - subtotal)} para frete grátis`;
  }
}

function abrirCheckout() {
  document.getElementById('carrinhoConteudo').style.display = 'none';
  document.getElementById('checkoutBox').style.display      = 'block';
}

function voltarCarrinho() {
  document.getElementById('checkoutBox').style.display = 'none';
  renderCarrinho();
}

function finalizarPedido(e) {
  e.preventDefault();
  const form     = e.target;
  const itens    = DB.Carrinho.itens();
  const subtotal = DB.Carrinho.subtotal();
  const frete    = subtotal >= 150 ? 0 : 15.90;

  const pedido = DB.Pedidos.criar({
    cliente:    form.querySelector('[name=nome]').value,
    email:      form.querySelector('[name=email]').value,
    telefone:   form.querySelector('[name=telefone]').value,
    cep:        form.querySelector('[name=cep]').value,
    rua:        form.querySelector('[name=rua]').value,
    numero:     form.querySelector('[name=numero]').value,
    cidade:     form.querySelector('[name=cidade]').value,
    pagamento:  form.querySelector('[name=pagamento]:checked')?.value || 'cartao',
    itens,
    subtotal,
    frete,
    total: subtotal + frete,
  });

  DB.Carrinho.limpar();
  atualizarBadgeCarrinho();

  document.getElementById('checkoutBox').style.display  = 'none';
  document.getElementById('carrinhoVazio').style.display = 'none';
  const conclEl = document.getElementById('pedidoConcluido');
  conclEl.style.display = 'flex';
  conclEl.querySelector('.numero-pedido').textContent = '#' + pedido.numero;
}

function continuarComprando() {
  document.getElementById('pedidoConcluido').style.display = 'none';
  navegarPara('home');
  renderCarrinho();
}

// ---------- AUTENTICAÇÃO ----------
const USER_SESSION_KEY = 'ps_usuario_ativo';

function getUsuarioSessao() {
  const raw = sessionStorage.getItem(USER_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setUsuarioSessao(user) {
  sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
}

function iniciarSessao(user, label) {
  setUsuarioSessao(user);
  const wrapper = document.querySelector('.wrapper');
  document.getElementById('loginOverlay').style.display = 'none';
  wrapper.classList.remove('hidden');
  wrapper.style.display = 'flex';
  document.getElementById('userLabel').textContent = label || user.email;
  mostrarToast(`Olá, ${label || user.email}!`);
}

function getUsuarioSessao() {
  try {
    const raw = sessionStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    sessionStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
}

function mostrarLogin() {
  document.getElementById('loginForm').style.display = 'grid';
  document.getElementById('registerCard').style.display = 'none';
  document.getElementById('recoverCard').style.display = 'none';
  document.getElementById('loginMessage').textContent = '';
  document.getElementById('recoverStep2').style.display = 'none';
  document.querySelector('#recoverForm button').textContent = 'Enviar link';
}

function mostrarCriarConta() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerCard').style.display = 'block';
  document.getElementById('recoverCard').style.display = 'none';
  document.getElementById('loginMessage').textContent = '';
}

function mostrarRecuperar() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerCard').style.display = 'none';
  document.getElementById('recoverCard').style.display = 'block';
  document.getElementById('recoverStep2').style.display = 'none';
  document.querySelector('#recoverForm button').textContent = 'Enviar link';
  document.getElementById('loginMessage').textContent = '';
}

function entrarGoogle() {
  const user = DB.Usuarios.criarGoogleUser();
  iniciarSessao(user, 'Google');
}

function entrarEmail(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const user  = DB.Usuarios.login(email, senha);
  if (!user) {
    document.getElementById('loginMessage').textContent = 'E-mail ou senha inválidos.';
    return;
  }
  iniciarSessao(user);
}

function criarConta(e) {
  e.preventDefault();
  const email  = document.getElementById('regEmail').value.trim().toLowerCase();
  const senha  = document.getElementById('regSenha').value;
  const senha2 = document.getElementById('regSenha2').value;

  if (senha !== senha2) {
    document.getElementById('loginMessage').textContent = 'As senhas não coincidem.';
    return;
  }
  if (DB.Usuarios.porEmail(email)) {
    document.getElementById('loginMessage').textContent = 'Este e-mail já tem conta.';
    return;
  }
  const user = DB.Usuarios.criar({ email, senha });
  iniciarSessao(user);
}

let recoverEmail = '';
function recuperarSenha(e) {
  e.preventDefault();
  const email = document.getElementById('recoverEmail').value.trim().toLowerCase();
  const user  = DB.Usuarios.porEmail(email);
  const step2 = document.getElementById('recoverStep2');
  const button = document.querySelector('#recoverForm button');

  if (!user) {
    document.getElementById('loginMessage').textContent = 'E-mail não encontrado.';
    return;
  }

  if (step2.style.display === 'none') {
    recoverEmail = email;
    step2.style.display = 'grid';
    button.textContent = 'Redefinir senha';
    document.getElementById('loginMessage').textContent = 'Digite a nova senha para sua conta.';
    return;
  }

  const senha  = document.getElementById('recoverSenha').value;
  const senha2 = document.getElementById('recoverSenha2').value;
  if (senha !== senha2) {
    document.getElementById('loginMessage').textContent = 'As senhas não coincidem.';
    return;
  }

  DB.Usuarios.atualizarSenha(recoverEmail || email, senha);
  document.getElementById('loginMessage').textContent = 'Senha redefinida com sucesso. Agora faça login.';
  document.getElementById('recoverStep2').style.display = 'none';
  button.textContent = 'Enviar link';
  recoverEmail = '';
}

function continuarVisitante() {
  const user = { id: 'visitante', email: 'Visitante' };
  iniciarSessao(user, 'Visitante');
}

// ---------- PRODUTOS UI ----------
function renderProdutos(filtro = 'Todos') {
  const grid = document.getElementById('produtosGrid');
  if (!grid) return;

  let produtos = DB.Produtos.todos();
  if (filtro !== 'Todos') produtos = produtos.filter(p => p.categoria === filtro);

  if (produtos.length === 0) {
    grid.innerHTML = '<p class="sem-produtos">Nenhum produto nesta categoria.</p>';
    return;
  }

  grid.innerHTML = produtos.map(p => `
    <article class="produto-card" data-cat="${p.categoria}">
      <figure class="prod-fig">
        ${p.img
          ? `<img src="${p.img}" alt="${p.nome}">`
          : `<div class="prod-emoji">${p.emoji}</div>`}
        <figcaption class="sr-only">${p.descricao}</figcaption>
        ${p.badge ? `<span class="badge badge-${p.badge}">${p.badge === 'novo' ? 'Novo' : 'Promo'}</span>` : ''}
      </figure>
      <div class="prod-info">
        <small class="prod-cat">${p.categoria}</small>
        <h3>${p.nome}</h3>
        <p class="prod-desc">${p.descricao}</p>
        <div class="prod-bottom">
          <div class="prod-preco">
            ${p.precoAntigo ? `<del>R$ ${fmt(p.precoAntigo)}</del>` : ''}
            <strong>R$ ${fmt(p.preco)}</strong>
          </div>
          <button class="btn-comprar" onclick="adicionarCarrinho('${p.id}')">
            Comprar
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function filtrarProdutos(cat, btn) {
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  renderProdutos(cat);
}

// ---------- AGENDAMENTO ----------
let agServico  = null;
let agHorario  = null;

function selecionarServico(id, card) {
  agServico = id;
  agHorario = null;
  document.querySelectorAll('.serv-card').forEach(c => c.classList.remove('sel'));
  card.classList.add('sel');

  const nomes = {
    'banho-tosa': 'Banho & Tosa',
    veterinario:  'Consulta Veterinária',
    hotel:        'Hotel Pet',
    adestramento: 'Adestramento',
  };

  const box = document.getElementById('agendBox');
  document.getElementById('agendServNome').textContent = nomes[id] || '';
  document.getElementById('etapaHorario').style.display = 'block';
  document.getElementById('etapaDados').style.display   = 'none';
  document.getElementById('agendConfirm').style.display = 'none';
  box.style.display = 'block';
  document.querySelectorAll('.hor-btn').forEach(b => b.classList.remove('sel'));
  document.getElementById('stepHorario').classList.add('ativo');
  document.getElementById('stepDados').classList.remove('ativo');
  setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function selecionarHorario(h, btn) {
  agHorario = h;
  document.querySelectorAll('.hor-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  setTimeout(() => {
    document.getElementById('etapaHorario').style.display = 'none';
    document.getElementById('etapaDados').style.display   = 'block';
    document.getElementById('stepHorario').classList.remove('ativo');
    document.getElementById('stepDados').classList.add('ativo');
  }, 350);
}

function confirmarAgendamento(e) {
  e.preventDefault();
  const nomePet = document.getElementById('agNomePet').value;
  const tutor   = document.getElementById('agTutor').value;
  const tel     = document.getElementById('agTel').value;
  const data    = document.getElementById('agData').value;

  const nomes = { 'banho-tosa': 'Banho & Tosa', veterinario: 'Consulta Veterinária', hotel: 'Hotel Pet', adestramento: 'Adestramento' };

  DB.Agendamentos.criar({ servico: nomes[agServico] || agServico, nomePet, tutor, telefone: tel, dataDesejada: data, horario: agHorario });

  document.getElementById('etapaDados').style.display   = 'none';
  document.getElementById('agendConfirm').style.display = 'flex';
  document.getElementById('agendConfirmTxt').innerHTML  =
    `<strong>${nomes[agServico]}</strong> para <strong>${nomePet}</strong><br>Data: <strong>${formatarData(data)}</strong> às <strong>${agHorario}</strong>`;

  document.getElementById('agNomePet').value = '';
  document.getElementById('agTutor').value   = '';
  document.getElementById('agTel').value     = '';
  document.getElementById('agData').value    = '';
}

function novoAgendamento() {
  agServico = null; agHorario = null;
  document.querySelectorAll('.serv-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('agendBox').style.display    = 'none';
  document.getElementById('agendConfirm').style.display= 'none';
}

// ---------- CONTATO ----------
function enviarMensagem(e) {
  e.preventDefault();
  const form = e.target;
  DB.Mensagens.criar({
    nome:     form.querySelector('[name=nome]').value,
    email:    form.querySelector('[name=email]').value,
    assunto:  form.querySelector('[name=assunto]').value,
    mensagem: form.querySelector('[name=mensagem]').value,
  });
  document.getElementById('formContato').style.display    = 'none';
  document.getElementById('mensagemEnviada').style.display = 'flex';
  mostrarToast('Mensagem enviada! Responderemos em até 24h.');
}

function novaMensagem() {
  document.getElementById('mensagemEnviada').style.display = 'none';
  document.getElementById('formContato').style.display     = 'block';
  document.querySelectorAll('#formContato input, #formContato textarea').forEach(el => el.value = '');
}

// ---------- NAVEGAÇÃO ----------
function navegarPara(pagina) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('ativa'));
  const target = document.getElementById('page-' + pagina);
  if (target) { target.classList.add('ativa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('ativo', l.dataset.page === pagina);
  });
  if (pagina === 'produtos') renderProdutos();
  if (pagina === 'carrinho') renderCarrinho();
  fecharMenu();
}

// ---------- MENU MOBILE ----------
function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('aberta');
  document.getElementById('overlay').classList.toggle('vis');
  document.body.classList.toggle('no-scroll');
}

function fecharMenu() {
  document.getElementById('sidebar').classList.remove('aberta');
  document.getElementById('overlay').classList.remove('vis');
  document.body.classList.remove('no-scroll');
}

// ---------- TOAST ----------
let toastTimer;
function mostrarToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('vis');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('vis'), 3000);
}

// ---------- UTILITÁRIOS ----------
function fmt(v) { return Number(v).toFixed(2).replace('.', ','); }

function formatarData(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  const sessionUser = getUsuarioSessao();
  if (sessionUser) {
    document.getElementById('loginOverlay').style.display = 'none';
    const wrapper = document.querySelector('.wrapper');
    wrapper.classList.remove('hidden');
    wrapper.style.display = 'flex';
    document.getElementById('userLabel').textContent = sessionUser.email;
  }
  atualizarBadgeCarrinho();
  renderProdutos();
  mostrarLogin();

  // Define data mínima de agendamento = amanhã
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
  const agData = document.getElementById('agData');
  if (agData) agData.min = amanha.toISOString().split('T')[0];
});
