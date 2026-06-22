// ============================================================
//  ADMIN.JS — painel administrativo
// ============================================================

// ---------- AUTH ----------
function fazerLogin(e) {
  e.preventDefault();
  const senha = document.getElementById('adminSenha').value;
  if (DB.Admin.login(senha)) {
    document.getElementById('loginScreen').style.display  = 'none';
    document.getElementById('adminPanel').style.display   = 'flex';
    carregarDashboard();
  } else {
    document.getElementById('erroLogin').style.display = 'block';
    document.getElementById('adminSenha').value = '';
  }
}

function fazerLogout() {
  DB.Admin.logout();
  document.getElementById('adminPanel').style.display  = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminSenha').value = '';
}

// ---------- NAVEGAÇÃO ADMIN ----------
function navAdmin(secao) {
  document.querySelectorAll('.adm-page').forEach(p => p.style.display = 'none');
  document.getElementById('adm-' + secao).style.display = 'block';
  document.querySelectorAll('.adm-nav-btn').forEach(b => b.classList.remove('ativo'));
  document.querySelector(`[data-sec="${secao}"]`).classList.add('ativo');

  switch (secao) {
    case 'dashboard':   carregarDashboard(); break;
    case 'pedidos':     carregarPedidos(); break;
    case 'mensagens':   carregarMensagens(); break;
    case 'agendamentos':carregarAgendamentos(); break;
    case 'produtos':    carregarProdutos(); break;
  }
}

// ---------- DASHBOARD ----------
function carregarDashboard() {
  const ps = DB.Pedidos.stats();
  const ms = DB.Mensagens.stats();
  const as = DB.Agendamentos.stats();
  const prods = DB.Produtos.todos().length;

  document.getElementById('stat-receita').textContent    = 'R$ ' + fmt(ps.receita);
  document.getElementById('stat-pedidos').textContent    = ps.total;
  document.getElementById('stat-msgs').textContent       = ms.naoLidas;
  document.getElementById('stat-produtos').textContent   = prods;

  // Gráfico simples de status de pedidos
  const barEl = document.getElementById('graficoStatus');
  if (!barEl) return;
  const total = ps.total || 1;
  barEl.innerHTML = [
    { label: 'Pendentes', val: ps.pendentes, cor: '#f59e0b' },
    { label: 'Enviados',  val: ps.enviados,  cor: '#3b82f6' },
    { label: 'Entregues', val: ps.entregues, cor: '#16a34a' },
  ].map(({ label, val, cor }) => `
    <div class="graf-item">
      <span class="graf-label">${label}</span>
      <div class="graf-bar-wrap">
        <div class="graf-bar" style="width:${Math.round((val/total)*100)}%;background:${cor}"></div>
      </div>
      <span class="graf-val">${val}</span>
    </div>
  `).join('');

  // Últimos 5 pedidos
  const pedidos = DB.Pedidos.todos().slice(-5).reverse();
  document.getElementById('ultPedidos').innerHTML = pedidos.length === 0
    ? '<tr><td colspan="5" class="tc">Nenhum pedido ainda.</td></tr>'
    : pedidos.map(p => `
      <tr>
        <td><strong>#${p.numero}</strong></td>
        <td>${p.cliente}</td>
        <td>${formatarData(p.data)}</td>
        <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
        <td>R$ ${fmt(p.total)}</td>
      </tr>
    `).join('');
}

// ---------- PEDIDOS ----------
function carregarPedidos(filtro = 'Todos') {
  let pedidos = DB.Pedidos.todos().reverse();
  if (filtro !== 'Todos') pedidos = pedidos.filter(p => p.status === filtro);

  const tbody = document.getElementById('tabelaPedidos');
  tbody.innerHTML = pedidos.length === 0
    ? '<tr><td colspan="6" class="tc">Nenhum pedido encontrado.</td></tr>'
    : pedidos.map(p => `
      <tr>
        <td><strong>#${p.numero}</strong></td>
        <td>${p.cliente}<br><small>${p.email}</small></td>
        <td>${formatarData(p.data)}</td>
        <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
        <td>R$ ${fmt(p.total)}</td>
        <td>
          <button class="btn-sm btn-det" onclick="verDetalhePedido('${p.id}')">Detalhes</button>
          <select class="sel-status" onchange="mudarStatus('${p.id}', this.value)">
            <option ${p.status==='Pendente' ?'selected':''}>Pendente</option>
            <option ${p.status==='Enviado'  ?'selected':''}>Enviado</option>
            <option ${p.status==='Entregue' ?'selected':''}>Entregue</option>
            <option ${p.status==='Cancelado'?'selected':''}>Cancelado</option>
          </select>
        </td>
      </tr>
    `).join('');
}

function filtrarPedidos(filtro, btn) {
  document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  carregarPedidos(filtro);
}

function mudarStatus(id, status) {
  DB.Pedidos.atualizarStatus(id, status);
  carregarPedidos();
}

function verDetalhePedido(id) {
  const p = DB.Pedidos.porId(id);
  if (!p) return;
  const itens = (p.itens || []).map(i =>
    `<li>${i.emoji} ${i.nome} × ${i.qty} — R$ ${fmt(i.preco * i.qty)}</li>`
  ).join('');
  abrirModal(`
    <h3>Pedido #${p.numero}</h3>
    <p><strong>Cliente:</strong> ${p.cliente}</p>
    <p><strong>E-mail:</strong> ${p.email}</p>
    <p><strong>Telefone:</strong> ${p.telefone || '—'}</p>
    <p><strong>Endereço:</strong> ${p.rua}, ${p.numero} — ${p.cidade} — CEP ${p.cep}</p>
    <p><strong>Pagamento:</strong> ${p.pagamento}</p>
    <p><strong>Status:</strong> ${p.status}</p>
    <hr>
    <p><strong>Itens:</strong></p>
    <ul class="detalhe-itens">${itens || '<li>—</li>'}</ul>
    <hr>
    <p><strong>Subtotal:</strong> R$ ${fmt(p.subtotal)}</p>
    <p><strong>Frete:</strong> ${p.frete === 0 ? 'Grátis' : 'R$ ' + fmt(p.frete)}</p>
    <p><strong>Total:</strong> <strong class="preco-destaque">R$ ${fmt(p.total)}</strong></p>
  `);
}

// ---------- MENSAGENS ----------
function carregarMensagens() {
  const msgs  = DB.Mensagens.todas().reverse();
  const lista = document.getElementById('listaMensagens');
  lista.innerHTML = msgs.length === 0
    ? '<p class="sem-dados">Nenhuma mensagem recebida ainda.</p>'
    : msgs.map(m => `
      <div class="msg-card ${m.lida ? 'lida' : 'nao-lida'}">
        <div class="msg-header">
          <div>
            <strong>${m.nome}</strong>
            <span class="msg-email">${m.email}</span>
          </div>
          <div class="msg-meta">
            <time datetime="${m.data}">${formatarData(m.data)}</time>
            ${!m.lida ? '<span class="badge-nao-lida">Nova</span>' : ''}
          </div>
        </div>
        <p class="msg-assunto"><strong>Assunto:</strong> ${m.assunto}</p>
        <p class="msg-texto">${m.mensagem}</p>
        <div class="msg-acoes">
          ${!m.lida ? `<button class="btn-sm btn-verde" onclick="marcarLida('${m.id}')">✓ Marcar como lida</button>` : '<span class="txt-lida">✓ Lida</span>'}
          <button class="btn-sm btn-danger" onclick="excluirMensagem('${m.id}')">Excluir</button>
        </div>
      </div>
    `).join('');
}

function marcarLida(id) {
  DB.Mensagens.marcarLida(id);
  carregarMensagens();
}

function excluirMensagem(id) {
  if (!confirm('Excluir esta mensagem?')) return;
  DB.Mensagens.excluir(id);
  carregarMensagens();
}

// ---------- AGENDAMENTOS ----------
function carregarAgendamentos() {
  const ags   = DB.Agendamentos.todos().reverse();
  const tbody = document.getElementById('tabelaAgend');
  tbody.innerHTML = ags.length === 0
    ? '<tr><td colspan="6" class="tc">Nenhum agendamento ainda.</td></tr>'
    : ags.map(a => `
      <tr>
        <td>${a.servico}</td>
        <td>${a.nomePet}</td>
        <td>${a.tutor}</td>
        <td>${formatarData(a.dataDesejada)} ${a.horario ? 'às ' + a.horario : ''}</td>
        <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
        <td>
          ${a.status !== 'Cancelado'
            ? `<button class="btn-sm btn-danger" onclick="cancelarAg('${a.id}')">Cancelar</button>`
            : '—'}
        </td>
      </tr>
    `).join('');
}

function cancelarAg(id) {
  if (!confirm('Cancelar este agendamento?')) return;
  DB.Agendamentos.cancelar(id);
  carregarAgendamentos();
}

// ---------- PRODUTOS ADMIN ----------
let prodEditando = null;

function carregarProdutos() {
  const prods = DB.Produtos.todos();
  const tbody = document.getElementById('tabelaProdutos');
  tbody.innerHTML = prods.length === 0
    ? '<tr><td colspan="6" class="tc">Nenhum produto.</td></tr>'
    : prods.map(p => `
      <tr>
        <td>${p.emoji}</td>
        <td><strong>${p.nome}</strong><br><small>${p.categoria}</small></td>
        <td>R$ ${fmt(p.preco)}</td>
        <td>${p.estoque}</td>
        <td>${p.badge ? `<span class="badge badge-${p.badge}">${p.badge}</span>` : '—'}</td>
        <td>
          <button class="btn-sm btn-det" onclick="editarProduto('${p.id}')">Editar</button>
          <button class="btn-sm btn-danger" onclick="excluirProduto('${p.id}')">Excluir</button>
        </td>
      </tr>
    `).join('');
}

function abrirFormProduto(limpar = true) {
  if (limpar) {
    prodEditando = null;
    document.getElementById('formProdTitle').textContent = 'Novo Produto';
    document.getElementById('formProd').reset();
  }
  document.getElementById('formProdBox').style.display = 'block';
}

function fecharFormProduto() {
  document.getElementById('formProdBox').style.display = 'none';
  prodEditando = null;
}

function editarProduto(id) {
  const p = DB.Produtos.porId(id);
  if (!p) return;
  prodEditando = p;
  document.getElementById('formProdTitle').textContent = 'Editar Produto';
  const f = document.getElementById('formProd');
  f.querySelector('[name=nome]').value        = p.nome;
  f.querySelector('[name=categoria]').value   = p.categoria;
  f.querySelector('[name=preco]').value       = p.preco;
  f.querySelector('[name=precoAntigo]').value = p.precoAntigo || '';
  f.querySelector('[name=estoque]').value     = p.estoque;
  f.querySelector('[name=emoji]').value       = p.emoji;
  f.querySelector('[name=badge]').value       = p.badge;
  f.querySelector('[name=descricao]').value   = p.descricao;
  abrirFormProduto(false);
}

function salvarProduto(e) {
  e.preventDefault();
  const f = e.target;
  const produto = {
    ...(prodEditando || {}),
    nome:       f.querySelector('[name=nome]').value,
    categoria:  f.querySelector('[name=categoria]').value,
    preco:      parseFloat(f.querySelector('[name=preco]').value),
    precoAntigo:parseFloat(f.querySelector('[name=precoAntigo]').value) || null,
    estoque:    parseInt(f.querySelector('[name=estoque]').value),
    emoji:      f.querySelector('[name=emoji]').value,
    badge:      f.querySelector('[name=badge]').value,
    descricao:  f.querySelector('[name=descricao]').value,
    img: prodEditando?.img || '',
  };
  DB.Produtos.salvar(produto);
  fecharFormProduto();
  carregarProdutos();
  mostrarToastAdmin('Produto salvo com sucesso!');
}

function excluirProduto(id) {
  if (!confirm('Excluir este produto permanentemente?')) return;
  DB.Produtos.excluir(id);
  carregarProdutos();
}

// ---------- MODAL ----------
function abrirModal(html) {
  document.getElementById('modalConteudo').innerHTML = html;
  document.getElementById('modal').style.display     = 'flex';
}

function fecharModal() {
  document.getElementById('modal').style.display = 'none';
}

// ---------- TOAST ADMIN ----------
let toastAdmTimer;
function mostrarToastAdmin(msg) {
  const el = document.getElementById('toastAdmin');
  el.textContent = msg;
  el.classList.add('vis');
  clearTimeout(toastAdmTimer);
  toastAdmTimer = setTimeout(() => el.classList.remove('vis'), 3000);
}

// ---------- UTILITÁRIOS ----------
function fmt(v) { return Number(v).toFixed(2).replace('.', ','); }

function formatarData(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) {
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  }
  return d.toLocaleDateString('pt-BR');
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (DB.Admin.logado()) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display  = 'flex';
    carregarDashboard();
  }
});
