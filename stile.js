var TAXA_ENTREGA = 6;

var PRODUTOS = [
    { id: 1, nome: 'Margherita', preco: 29.9, foto: 'margherita' },
    { id: 2, nome: 'Pepperoni', preco: 34.9, foto: 'pepperoni' },
    { id: 3, nome: 'Quatro Queijos', preco: 39.9, foto: 'quatro-queijos' },
    { id: 4, nome: 'Frango com Catupiry', preco: 36.9, foto: 'frango-catupiry' },
    { id: 5, nome: 'Calabresa', preco: 33.9, foto: 'calabresa' },
    { id: 6, nome: 'Refrigerante 2L', preco: 12, foto: 'refrigerante' },
    { id: 7, nome: 'Portuguesa', preco: 37.9, foto: 'portuguesa' },
    { id: 8, nome: 'Napolitana', preco: 32.9, foto: 'napolitana' },
    { id: 9, nome: 'Bacon', preco: 35.9, foto: 'bacon' },
    { id: 10, nome: 'Vegetariana', preco: 34.9, foto: 'vegetariana' },
    { id: 11, nome: 'Strogonoff de Frango', preco: 38.9, foto: 'strogonoff' },
    { id: 12, nome: 'Brigadeiro', preco: 36.9, foto: 'brigadeiro' },
    { id: 13, nome: 'Banana com Canela', preco: 32.9, foto: 'banana-canela' },
    { id: 14, nome: 'Guaraná 2L', preco: 11, foto: 'guarana' },
    { id: 15, nome: 'Suco de Laranja 1L', preco: 10, foto: 'suco-laranja' },
    { id: 16, nome: 'Água mineral 500ml', preco: 4, foto: 'agua' }
];

var usuarioLogado = null;

function ler(chave, padrao) {
    try {
        var v = localStorage.getItem(chave);
        if (v !== null) {
            return JSON.parse(v);
        }
    } catch (e) {}

    return padrao;
}

function salvar(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {}
}

function garantirContaDemo() {
    var usuarios = ler('phoenix_usuarios', []);

    if (!usuarios.some(function (u) {
        return u.email === 'demo@phoenix.com';
    })) {
        usuarios.push({
            id: 1,
            nome: 'Cliente Demo',
            email: 'demo@phoenix.com',
            telefone: '(11) 99999-0000',
            endereco: 'Rua das Pizzas, 100',
            senha: '123456'
        });

        salvar('phoenix_usuarios', usuarios);
    }
}

function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c];
    });
}

function dinheiro(v) {
    return v.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function calcularTotais(itens) {
    var subtotal = itens.reduce(function (s, i) {
        return s + i.produto.preco * i.qtd;
    }, 0);

    var entrega = itens.length ? TAXA_ENTREGA : 0;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        entrega: entrega,
        total: Math.round((subtotal + entrega) * 100) / 100
    };
}

function mostrar(id, texto, tipo) {
    var el = document.getElementById(id);

    if (!el) {
        return;
    }

    el.textContent = texto;
    el.className = 'mensagem-site mensagem-' + tipo;
}

function parametroVoltar() {
    var v = new URLSearchParams(location.search).get('voltar') || '';

    return /^[a-z]+\.html$/.test(v) ? v : '';
}

function arquivoAtual() {
    return location.pathname.split('/').pop() || 'index.html';
}

function imagensDa(nomeDaPizza) {
    return document.querySelectorAll('div.' + nomeDaPizza + ' img');
}

function memorizarImagens() {
    var mapa = ler('phoenix_fotos', {});

    PRODUTOS.forEach(function (p) {
        Array.prototype.forEach.call(imagensDa(p.foto), function (img) {
            var src = (img.getAttribute('src') || '').trim();

            if (src) {
                mapa[p.foto] = src;
            }
        });
    });

    salvar('phoenix_fotos', mapa);
}

function completarImagens() {
    var mapa = ler('phoenix_fotos', {});

    PRODUTOS.forEach(function (p) {
        Array.prototype.forEach.call(imagensDa(p.foto), function (img) {
            if (!(img.getAttribute('src') || '').trim() && mapa[p.foto]) {
                img.src = mapa[p.foto];
            }
        });
    });
}

function imagemDe(nomeDaPizza) {
    return ler('phoenix_fotos', {})[nomeDaPizza] || '';
}

var Api = {
    cadastrar: async function (d) {
        var usuarios = ler('phoenix_usuarios', []);
        var email = d.email.trim().toLowerCase();

        if (usuarios.some(function (u) {
            return u.email === email;
        })) {
            throw new Error('Este email já está cadastrado.');
        }

        var novo = {
            id: Date.now(),
            nome: d.nome.trim(),
            email: email,
            telefone: d.telefone.trim(),
            endereco: d.endereco.trim(),
            senha: d.senha
        };

        usuarios.push(novo);
        salvar('phoenix_usuarios', usuarios);

        var sessao = {
            id: novo.id,
            nome: novo.nome,
            email: novo.email
        };

        salvar('phoenix_sessao', sessao);

        return sessao;
    },

    login: async function (email, senha) {
        var emailLimpo = email.trim().toLowerCase();

        var u = ler('phoenix_usuarios', []).find(function (x) {
            return x.email === emailLimpo && x.senha === senha;
        });

        if (!u) {
            throw new Error('Email ou senha incorretos.');
        }

        var sessao = {
            id: u.id,
            nome: u.nome,
            email: u.email
        };

        salvar('phoenix_sessao', sessao);

        return sessao;
    },

    logout: async function () {
        salvar('phoenix_sessao', null);
    },

    usuarioAtual: async function () {
        return ler('phoenix_sessao', null);
    },

    obterCarrinho: async function () {
        return ler('phoenix_carrinho', []).map(function (i) {
            return {
                produto: PRODUTOS.find(function (p) {
                    return p.id === i.produtoId;
                }),
                qtd: i.qtd
            };
        }).filter(function (i) {
            return i.produto;
        });
    },

    adicionar: async function (id) {
        var c = ler('phoenix_carrinho', []);

        var item = c.find(function (i) {
            return i.produtoId === id;
        });

        if (item) {
            item.qtd += 1;
        } else {
            c.push({
                produtoId: id,
                qtd: 1
            });
        }

        salvar('phoenix_carrinho', c);
    },

    alterarQuantidade: async function (id, qtd) {
        qtd = parseInt(qtd, 10);

        if (!qtd || qtd < 1) {
            return Api.remover(id);
        }

        var c = ler('phoenix_carrinho', []);

        var item = c.find(function (i) {
            return i.produtoId === id;
        });

        if (item) {
            item.qtd = qtd;
            salvar('phoenix_carrinho', c);
        }
    },

    remover: async function (id) {
        salvar(
            'phoenix_carrinho',
            ler('phoenix_carrinho', []).filter(function (i) {
                return i.produtoId !== id;
            })
        );
    },

    finalizarPedido: async function () {
        var usuario = await Api.usuarioAtual();

        if (!usuario) {
            throw new Error('Faça login para finalizar o pedido.');
        }

        var itens = await Api.obterCarrinho();

        if (!itens.length) {
            throw new Error('Seu carrinho está vazio.');
        }

        var pedidos = ler('phoenix_pedidos', []);
        var totais = calcularTotais(itens);

        var pedido = {
            id: pedidos.length + 1,
            usuarioId: usuario.id,
            data: new Date().toISOString(),
            status: 'recebido',

            itens: itens.map(function (i) {
                return {
                    produtoId: i.produto.id,
                    nome: i.produto.nome,
                    preco: i.produto.preco,
                    qtd: i.qtd
                };
            }),

            subtotal: totais.subtotal,
            entrega: totais.entrega,
            total: totais.total
        };

        pedidos.push(pedido);

        salvar('phoenix_pedidos', pedidos);
        salvar('phoenix_carrinho', []);

        return pedido;
    }
};

async function atualizarMenu() {
    usuarioLogado = await Api.usuarioAtual();

    var itens = await Api.obterCarrinho();

    var qtd = itens.reduce(function (s, i) {
        return s + i.qtd;
    }, 0);

    var arquivo = arquivoAtual();

    var alvo = arquivo === 'cadastro.html' ? 'login.html' : arquivo;

    Array.prototype.forEach.call(
        document.querySelectorAll('.menu-pizzaria a'),
        function (a) {
            a.className = a.getAttribute('href') === alvo ? 'menu-ativo' : '';
        }
    );

    var linkCarrinho = document.getElementById('link-carrinho');

    if (linkCarrinho) {
        linkCarrinho.textContent = qtd ? 'Carrinho (' + qtd + ')' : 'Carrinho';
    }

    var linkLogin = document.getElementById('link-login');

    if (linkLogin) {
        linkLogin.textContent = usuarioLogado
            ? 'Sair (' + usuarioLogado.nome.split(' ')[0] + ')'
            : 'Login';
    }

    var barra = document.getElementById('barra');
    var cabecalho = document.querySelector('header');

    if (!barra && cabecalho) {
        barra = document.createElement('div');
        barra.id = 'barra';
        barra.className = 'faixa-boas-vindas';
        barra.hidden = true;

        cabecalho.insertAdjacentElement('afterend', barra);
    }

    if (barra) {
        barra.hidden = !usuarioLogado;

        if (usuarioLogado) {
            barra.textContent = 'Olá, ' +
                usuarioLogado.nome.split(' ')[0] +
                '! Você entrou como ' +
                usuarioLogado.email + '.';
        }
    }

    Array.prototype.forEach.call(
        document.querySelectorAll('[data-visitante]'),
        function (el) {
            el.hidden = !!usuarioLogado;
        }
    );
}

async function desenharCarrinho() {
    var area = document.getElementById('carrinho-area');

    if (!area) {
        return;
    }

    var itens = await Api.obterCarrinho();

    if (!itens.length) {
        area.innerHTML =
            '<div class="carrinho-vazio">' +
            '<p>Seu carrinho está vazio.</p>' +
            '<a class="botao-pedido" href="cardapio.html">Ver cardápio</a>' +
            '</div>';

        return;
    }

    var totais = calcularTotais(itens);

    var linhas = itens.map(function (i) {
        var foto = imagemDe(i.produto.foto);

        return '<tr>' +
            '<td><div class="carrinho-produto"><div class="carrinho-foto">' +
            (foto
                ? '<img src="' + esc(foto) + '" alt="' + esc(i.produto.nome) + '">'
                : '') +
            '</div>' + esc(i.produto.nome) + '</div></td>' +
            '<td>' + dinheiro(i.produto.preco) + '</td>' +
            '<td><input type="number" min="1" value="' + i.qtd +
            '" data-qtd="' + i.produto.id + '"></td>' +
            '<td>' + dinheiro(i.produto.preco * i.qtd) + '</td>' +
            '<td><button type="button" class="botao-pedido botao-pedido-claro botao-pedido-pequeno" data-remover="' +
            i.produto.id + '">Remover</button></td>' +
            '</tr>';
    }).join('');

    area.innerHTML =
        '<div class="carrinho-layout">' +
        '<div class="carrinho-tabela">' +
        '<table><thead><tr>' +
        '<th>Produto</th><th>Preço</th><th>Qtd.</th><th>Subtotal</th><th></th>' +
        '</tr></thead>' +
        '<tbody>' + linhas + '</tbody></table>' +
        '</div>' +
        '<div class="carrinho-resumo">' +
        '<h3>Resumo do pedido</h3>' +
        '<div class="resumo-linha"><span>Subtotal</span><span>' +
        dinheiro(totais.subtotal) + '</span></div>' +
        '<div class="resumo-linha"><span>Entrega</span><span>' +
        dinheiro(totais.entrega) + '</span></div>' +
        '<div class="resumo-linha resumo-total"><span>Total</span><span>' +
        dinheiro(totais.total) + '</span></div>' +
        '<button type="button" class="botao-pedido botao-pedido-cheio" id="finalizar">Finalizar pedido</button>' +
        '<a class="botao-pedido botao-pedido-claro botao-pedido-cheio" href="cardapio.html">Continuar comprando</a>' +
        '</div></div>';
}

function normalizar(t) {
    return String(t)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function iniciarBusca() {
    var campo = document.getElementById('busca-cardapio');

    if (!campo) {
        return;
    }

    var chips = document.querySelectorAll('[data-filtro]');
    var grupos = document.querySelectorAll('.cardapio-grupo');
    var vazio = document.getElementById('busca-vazio');
    var info = document.getElementById('busca-info');
    var categoria = 'todos';

    var itens = Array.prototype.map.call(
        document.querySelectorAll('.item-cardapio'),
        function (li) {
            var nome = li.querySelector('h3').textContent;
            var ingredientes = li.querySelector('.item-ingredientes').textContent;

            return {
                el: li,
                grupo: li.closest('.cardapio-grupo').dataset.categoria,
                texto: normalizar(nome + ' ' + ingredientes)
            };
        }
    );

    function filtrar() {
        var palavras = normalizar(campo.value.trim()).split(/\s+/).filter(Boolean);
        var total = 0;

        itens.forEach(function (item) {
            var okCategoria = categoria === 'todos' || item.grupo === categoria;

            var okTexto = palavras.every(function (p) {
                return item.texto.indexOf(p) !== -1;
            });

            item.el.hidden = !(okCategoria && okTexto);

            if (!item.el.hidden) {
                total++;
            }
        });

        Array.prototype.forEach.call(grupos, function (g) {
            g.hidden = !g.querySelector('.item-cardapio:not([hidden])');
        });

        vazio.hidden = total !== 0;

        if (palavras.length || categoria !== 'todos') {
            info.textContent = total + (total === 1 ? ' item encontrado' : ' itens encontrados');
        } else {
            info.textContent = '';
        }
    }

    campo.addEventListener('input', filtrar);

    Array.prototype.forEach.call(chips, function (chip) {
        chip.addEventListener('click', function () {
            categoria = chip.dataset.filtro;

            Array.prototype.forEach.call(chips, function (c) {
                c.classList.toggle('chip-ativo', c === chip);
            });

            filtrar();
        });
    });

    document.getElementById('busca-limpar').addEventListener('click', function () {
        campo.value = '';
        categoria = 'todos';

        Array.prototype.forEach.call(chips, function (c) {
            c.classList.toggle('chip-ativo', c.dataset.filtro === 'todos');
        });

        filtrar();
        campo.focus();
    });

    var busca = new URLSearchParams(location.search).get('busca');

    if (busca) {
        campo.value = busca;
    }

    filtrar();
}

function iniciarCardapio() {
    iniciarBusca();
    document.addEventListener('click', async function (e) {
        var botao = e.target.closest('[data-add]');

        if (!botao) {
            return;
        }

        await Api.adicionar(Number(botao.dataset.id));
        await atualizarMenu();

        botao.textContent = 'Adicionado';

        setTimeout(function () {
            botao.textContent = 'Adicionar';
        }, 1000);
    });
}

async function iniciarCarrinho() {
    var area = document.getElementById('carrinho-area');

    await desenharCarrinho();

    area.addEventListener('change', async function (e) {
        var campo = e.target.closest('[data-qtd]');

        if (!campo) {
            return;
        }

        await Api.alterarQuantidade(
            Number(campo.dataset.qtd),
            campo.value
        );

        await desenharCarrinho();
        await atualizarMenu();
    });

    area.addEventListener('click', async function (e) {
        var remover = e.target.closest('[data-remover]');

        if (remover) {
            await Api.remover(Number(remover.dataset.remover));

            await desenharCarrinho();
            await atualizarMenu();

            return;
        }

        if (e.target.id === 'finalizar') {
            if (!usuarioLogado) {
                location.href = 'login.html?voltar=carrinho.html';
                return;
            }

            try {
                var pedido = await Api.finalizarPedido();

                await desenharCarrinho();
                await atualizarMenu();

                mostrar(
                    'msg-carrinho',
                    'Pedido #' + pedido.id + ' recebido! Total: ' +
                    dinheiro(pedido.total) + '.',
                    'sucesso'
                );
            } catch (err) {
                mostrar('msg-carrinho', err.message, 'erro');
            }
        }
    });
}

function iniciarLogin() {
    var voltar = parametroVoltar();

    if (voltar) {
        mostrar(
            'msg-login',
            voltar === 'carrinho.html'
                ? 'Faça login para finalizar o pedido.'
                : 'Faça login para continuar.',
            'aviso'
        );

        var linkCadastro = document.querySelector('a[href="cadastro.html"]');

        if (linkCadastro) {
            linkCadastro.href = 'cadastro.html?voltar=' + voltar;
        }
    }

    var botaoDemo = document.getElementById('usar-demo');

    if (botaoDemo) {
        botaoDemo.addEventListener('click', function () {
            document.getElementById('login-email').value = 'demo@phoenix.com';
            document.getElementById('login-senha').value = '123456';
        });
    }

    var form = document.getElementById('form-login');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var d = Object.fromEntries(new FormData(form));

        try {
            await Api.login(d.email, d.senha);
            location.href = voltar || 'index.html';
        } catch (err) {
            mostrar('msg-login', err.message, 'erro');
        }
    });
}

function iniciarCadastro() {
    var voltar = parametroVoltar();

    if (voltar) {
        var linkLogin = document.querySelector('.caixa-acesso a[href="login.html"]');

        if (linkLogin) {
            linkLogin.href = 'login.html?voltar=' + voltar;
        }
    }

    var form = document.getElementById('form-cadastro');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var d = Object.fromEntries(new FormData(form));

        if (d.senha.length < 6) {
            mostrar(
                'msg-cadastro',
                'A senha precisa ter pelo menos 6 caracteres.',
                'erro'
            );

            return;
        }

        if (d.senha !== d.confirmar) {
            mostrar(
                'msg-cadastro',
                'As senhas não são iguais.',
                'erro'
            );

            return;
        }

        try {
            await Api.cadastrar(d);
            location.href = voltar || 'cardapio.html';
        } catch (err) {
            mostrar('msg-cadastro', err.message, 'erro');
        }
    });
}

document.addEventListener('click', async function (e) {
    var link = e.target.closest('#link-login');

    if (!link || !usuarioLogado) {
        return;
    }

    e.preventDefault();

    await Api.logout();

    location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', async function () {
    garantirContaDemo();
    memorizarImagens();
    completarImagens();

    try {
        await atualizarMenu();
    } catch (e) {
        console.error(e);
    }

    var paginas = {
        cardapio: iniciarCardapio,
        carrinho: iniciarCarrinho,
        login: iniciarLogin,
        cadastro: iniciarCadastro
    };

    var iniciar = paginas[document.body.dataset.page];

    if (iniciar) {
        await iniciar();
    }
});