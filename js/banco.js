// ============================================================
//  BANCO DE DADOS — localStorage como banco de dados
//  Simula um banco real com tabelas: produtos, pedidos,
//  mensagens, agendamentos, usuarios (admin)
// ============================================================

const DB = (() => {

  // ---------- helpers ----------
  const get  = key       => JSON.parse(localStorage.getItem(key) || '[]');
  const set  = (key, v)  => localStorage.setItem(key, JSON.stringify(v));
  const uid  = ()        => Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const now  = ()        => new Date().toISOString();

  // ---------- SEED inicial de produtos ----------
  function seedProdutos() {
    if (localStorage.getItem('ps_seeded')) return;
    const produtos = [
      { id: uid(), nome: 'Ração Premium Cão Adulto',  categoria: 'Alimentação', preco: 89.90,  precoAntigo: 119.90, descricao: 'Ração super premium para cães adultos, rica em proteínas e vitaminas. Saco 15kg.',  badge: 'promo', estoque: 42, emoji: '🐕', img: '' },
      { id: uid(), nome: 'Cama Ortopédica Pet',        categoria: 'Acessórios',  preco: 149.90, precoAntigo: null,   descricao: 'Cama com espuma ortopédica de alta densidade, ideal para pets idosos e de grande porte.', badge: 'novo',  estoque: 18, emoji: '🛏️', img: '' },
      { id: uid(), nome: 'Areia Higiênica Gatos 4kg',  categoria: 'Higiene',     preco: 39.90,  precoAntigo: null,   descricao: 'Areia de alta absorção com neutralizador de odores natural. Bag 4kg.',                  badge: '',     estoque: 95, emoji: '🐱', img: '' },
      { id: uid(), nome: 'Brinquedo Interativo',       categoria: 'Brinquedos',  preco: 34.90,  precoAntigo: 49.90,  descricao: 'Brinquedo que estimula o instinto natural do seu pet. Indicado para cães e gatos.',   badge: 'promo', estoque: 30, emoji: '🎾', img: '' },
      { id: uid(), nome: 'Shampoo Pet Natural',        categoria: 'Higiene',     preco: 28.90,  precoAntigo: null,   descricao: 'Fórmula 100% natural sem parabenos. Para cães e gatos de pelagem curta ou longa.',       badge: 'novo',  estoque: 60, emoji: '🧴', img: '' },
      { id: uid(), nome: 'Coleira Antipulgas 8m',      categoria: 'Saúde',       preco: 59.90,  precoAntigo: 79.90,  descricao: 'Proteção de até 8 meses contra pulgas, carrapatos e mosquitos. Tamanho M.',              badge: 'promo', estoque: 25, emoji: '🏷️', img: '' },
      { id: uid(), nome: 'Comedouro Inox Duplo',       categoria: 'Acessórios',  preco: 45.90,  precoAntigo: null,   descricao: 'Comedouro e bebedouro duplo em inox com suporte regulável em altura.',                   badge: '',     estoque: 22, emoji: '🥣', img: '' },
      { id: uid(), nome: 'Ração Gato Filhote',         categoria: 'Alimentação', preco: 54.90,  precoAntigo: 69.90,  descricao: 'Ração especial para gatinhos de 2 a 12 meses. Fórmula com DHA para desenvolvimento.',   badge: 'promo', estoque: 38, emoji: '🐾', img: '' },
      { id: uid(), nome: 'Kit Grooming Completo',      categoria: 'Higiene',     preco: 89.00,  precoAntigo: null,   descricao: 'Kit com escova, tesoura arredondada, pente e lima para unhas. Qualidade profissional.',  badge: 'novo',  estoque: 15, emoji: '✂️', img: '' },
      { id: uid(), nome: 'Suplemento Articular',       categoria: 'Saúde',       preco: 72.90,  precoAntigo: null,   descricao: 'Suplemento com glucosamina e condroitina para saúde das articulações. 60 cápsulas.',   badge: '',     estoque: 20, emoji: '💊', img: '' },
      { id: uid(), nome: 'Casa de Transporte M',       categoria: 'Acessórios',  preco: 119.90, precoAntigo: 149.90, descricao: 'Caixa de transporte resistente com ventilação nas quatro laterais. Tamanho M.',          badge: 'promo', estoque: 12, emoji: '📦', img: '' },
      { id: uid(), nome: 'Petisco Natural Frango',     categoria: 'Alimentação', preco: 19.90,  precoAntigo: null,   descricao: 'Petisco desidratado 100% frango, sem aditivos. 100g. Excelente para adestramento.',       badge: '',     estoque: 80, emoji: '🍗', img: '' },
    ];
    set('ps_produtos', produtos);
    localStorage.setItem('ps_seeded', '1');
  }

  // ---------- PRODUTOS ----------
  const Produtos = {
    todos()          { return get('ps_produtos'); },
    porId(id)        { return this.todos().find(p => p.id === id); },
    categorias()     { return [...new Set(this.todos().map(p => p.categoria))]; },
    salvar(produto)  {
      const lista = this.todos();
      const idx   = lista.findIndex(p => p.id === produto.id);
      if (idx >= 0) lista[idx] = produto;
      else lista.push({ ...produto, id: uid() });
      set('ps_produtos', lista);
    },
    excluir(id) {
      set('ps_produtos', this.todos().filter(p => p.id !== id));
    },
  };

  // ---------- PEDIDOS ----------
  const Pedidos = {
    todos()          { return get('ps_pedidos'); },
    porId(id)        { return this.todos().find(p => p.id === id); },
    criar(dados)     {
      const pedidos = this.todos();
      const pedido  = { ...dados, id: uid(), data: now(), status: 'Pendente', numero: 1000 + pedidos.length };
      pedidos.push(pedido);
      set('ps_pedidos', pedidos);
      return pedido;
    },
    atualizarStatus(id, status) {
      const pedidos = this.todos();
      const idx     = pedidos.findIndex(p => p.id === id);
      if (idx >= 0) { pedidos[idx].status = status; set('ps_pedidos', pedidos); }
    },
    stats() {
      const todos = this.todos();
      return {
        total:     todos.length,
        pendentes: todos.filter(p => p.status === 'Pendente').length,
        enviados:  todos.filter(p => p.status === 'Enviado').length,
        entregues: todos.filter(p => p.status === 'Entregue').length,
        receita:   todos.reduce((s, p) => s + (p.total || 0), 0),
      };
    },
  };

  // ---------- MENSAGENS ----------
  const Mensagens = {
    todas()      { return get('ps_mensagens'); },
    criar(dados) {
      const msgs = this.todas();
      const msg  = { ...dados, id: uid(), data: now(), lida: false };
      msgs.push(msg);
      set('ps_mensagens', msgs);
      return msg;
    },
    marcarLida(id) {
      const msgs = this.todas();
      const idx  = msgs.findIndex(m => m.id === id);
      if (idx >= 0) { msgs[idx].lida = true; set('ps_mensagens', msgs); }
    },
    excluir(id) {
      set('ps_mensagens', this.todas().filter(m => m.id !== id));
    },
    stats() {
      const todas = this.todas();
      return { total: todas.length, naoLidas: todas.filter(m => !m.lida).length };
    },
  };

  // ---------- AGENDAMENTOS ----------
  const Agendamentos = {
    todos()      { return get('ps_agendamentos'); },
    criar(dados) {
      const ags = this.todos();
      const ag  = { ...dados, id: uid(), data: now(), status: 'Confirmado' };
      ags.push(ag);
      set('ps_agendamentos', ags);
      return ag;
    },
    cancelar(id) {
      const ags = this.todos();
      const idx = ags.findIndex(a => a.id === id);
      if (idx >= 0) { ags[idx].status = 'Cancelado'; set('ps_agendamentos', ags); }
    },
    stats() {
      const todos = this.todos();
      return {
        total:      todos.length,
        confirmados: todos.filter(a => a.status === 'Confirmado').length,
        cancelados:  todos.filter(a => a.status === 'Cancelado').length,
      };
    },
  };

  // ---------- USUÁRIOS ----------
  const Usuarios = {
    todos()          { return get('ps_usuarios'); },
    porEmail(email)  { return this.todos().find(u => u.email.toLowerCase() === email.toLowerCase()); },
    criar(dados) {
      const usuarios = this.todos();
      const user = { id: uid(), email: dados.email.toLowerCase(), senha: dados.senha };
      usuarios.push(user);
      set('ps_usuarios', usuarios);
      return user;
    },
    login(email, senha) {
      const user = this.porEmail(email);
      return user && user.senha === senha ? user : null;
    },
    atualizarSenha(email, novaSenha) {
      const usuarios = this.todos();
      const idx = usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx >= 0) {
        usuarios[idx].senha = novaSenha;
        set('ps_usuarios', usuarios);
        return true;
      }
      return false;
    },
    criarGoogleUser() {
      const email = 'google@rowf.com';
      let user = this.porEmail(email);
      if (!user) user = this.criar({ email, senha: 'google-login' });
      return user;
    },
  };

  // ---------- ADMIN (sessão simples) ----------
  const Admin = {
    SENHA: 'senha123',
    login(senha)  { if (senha === this.SENHA) { sessionStorage.setItem('ps_admin', '1'); return true; } return false; },
    logout()      { sessionStorage.removeItem('ps_admin'); },
    logado()      { return sessionStorage.getItem('ps_admin') === '1'; },
  };

  // ---------- CARRINHO (sessionStorage) ----------
  const Carrinho = {
    itens()              { return JSON.parse(sessionStorage.getItem('ps_carrinho') || '[]'); },
    _salvar(itens)       { sessionStorage.setItem('ps_carrinho', JSON.stringify(itens)); },
    adicionar(produto)   {
      const itens = this.itens();
      const idx   = itens.findIndex(i => i.id === produto.id);
      if (idx >= 0) itens[idx].qty += 1;
      else itens.push({ ...produto, qty: 1 });
      this._salvar(itens);
    },
    remover(id)          { this._salvar(this.itens().filter(i => i.id !== id)); },
    alterarQty(id, qty)  {
      if (qty <= 0) { this.remover(id); return; }
      const itens = this.itens();
      const idx   = itens.findIndex(i => i.id === id);
      if (idx >= 0) { itens[idx].qty = qty; this._salvar(itens); }
    },
    limpar()             { sessionStorage.removeItem('ps_carrinho'); },
    subtotal()           { return this.itens().reduce((s, i) => s + i.preco * i.qty, 0); },
    count()              { return this.itens().reduce((s, i) => s + i.qty, 0); },
  };

  // ---------- USUÁRIOS SEED ----------
  function seedUsuarios() {
    if (localStorage.getItem('ps_usuarios_seeded')) return;
    set('ps_usuarios', [
      { id: uid(), email: 'admin@rowf.com', senha: 'senha123' }
    ]);
    localStorage.setItem('ps_usuarios_seeded', '1');
  }

  // inicializa seed
  seedProdutos();
  seedUsuarios();

  return { Produtos, Pedidos, Mensagens, Agendamentos, Usuarios, Admin, Carrinho, uid };
})();
