import http from 'http';
import { Chamado } from './chamado.js';

const chamados = [
    new Chamado(1,"Recursos Humanos","Reparo de computador","Média"),
    new Chamado(2,"Recepção","Troca de tonner da impressora","Alta"),
    new Chamado(3,"Segurança do trabalho","Troca de monitor","Baixa")
]

const server = http.createServer((req, res) => { 

  if (req.method === 'GET' && req.url === '/health') { 
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' })); 
    return;
  }

  if (req.method === 'GET' && req.url ==='/chamados'){
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(chamados))
    return; 
  };

  if (req.method === 'GET' && req.url.startsWith('/chamados/')){
    try {
        const id = extractId(req);
        if (isValidId(id)) {
          const chamado = chamados.find(chamado => chamado.id === Number(id));
        if (!chamado) {
          throw new NotFoundError("Recurso não encontrado.");
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(chamado));
        return;
      } 
    } catch (error) {
      SendError(res, error);
    }
  };

  if(req.method === 'POST' && req.url === '/chamados'){
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
      try{
        const data = JSON.parse(body);
        const newChamado = new Chamado(chamados.length+1,data.solicitante,data.descricao,data.prioridade);
        if (!HasValidFields(newChamado)) {
          throw new ValidationError("Campos obrigatórios ausentes ou com tipo inválido.");
        }
        if (!hasValidBusinessRules(newChamado)) {
          throw new UnprocessableEntityError("Prioridade inválida ou descrição muito curta.");
        }
        CreateChamado(newChamado);
        res.writeHead(201,{'Content-type': 'application/json' });
        res.end(JSON.stringify({status: 'created', data: newChamado}));
      }catch(error){
        SendError(res,error)
      }
    });
    return;
  }
  res.writeHead(404,{'Content-type': 'application/json' })
  res.end(JSON.stringify({error: 'Requisição inválida.',}))
});


//metodos auxiliares

function CreateChamado(chamado) {
    const newChamado = new Chamado( 
        chamado.id,
        chamado.solicitante,
        chamado.descricao,
        chamado.prioridade
    );
    chamados.push(newChamado);
    return newChamado;
};

function SendError(res,error){
  const statuscode = error.statusCode || 500;
  const message = error.message || 'Erro interno do sistema';
  res.writeHead(statuscode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({error: message}));
};

function isValidId(id){
  if (!id || isNaN(id) || id <= 0) {
    return false;
  }
  return true
};

function extractId(req){
  return req.url.split('/').pop();

};

function HasValidFields(chamado){
  return (
    chamado.solicitante && typeof chamado.solicitante === 'string' &&
    chamado.descricao && typeof chamado.descricao === 'string' &&
    chamado.prioridade && typeof chamado.prioridade === 'string'
  );
};

function hasValidBusinessRules(chamado){
  const prioridadesPermitidas = ['alta','media''baixa'];
  const prioridadeValida = prioridadesPermitidas.includes(chamado.prioridade);
  const descricaoLonga = chamado.descricao.length >= 5;
  return prioridadeValida && descricaoLonga;
};

// classes de erros

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
};

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400); 
  }
};

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404); 
  }
};

class UnprocessableEntityError extends AppError {
  constructor(message) {
    super(message, 422);
  }
}

server.listen(3000); 
