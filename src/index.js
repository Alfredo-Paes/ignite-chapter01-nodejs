const { request, response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

const customers = [];

const PORT = 3333;

app.use(express.json());

function verifyIfAcountExists(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((cpfExists) => cpfExists.cpf === cpf);

  if (!customer) {
    return response.status(400).send({ error: "Customer not found!" });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

app.post("/acount", (request, response) => {
  const { name, cpf } = request.body;

  const cpfAlreadyExists = customers.some(
    (cpfCustomer) => cpfCustomer.cpf === cpf
  );

  if (cpfAlreadyExists) {
    return response.status(400).send({ error: "Customer already exists" });
  }

  customers.push({
    id: uuidv4(),
    name,
    cpf,
    statement: [],
  });

  return response.status(201).send({ message: "Customer created!" });
});

//app.use(verifyIfAcountExists)

app.post("/deposit", verifyIfAcountExists, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperations = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperations);

  return response.status(201).send({ message: "Statement ok!" });
});

app.get("/client", verifyIfAcountExists, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.get("/statement", verifyIfAcountExists, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.get("/statement/date", verifyIfAcountExists, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  if (statement.length === 0) {
    return response
      .status(400)
      .json({ error: "No extract found through that date!" });
  }

  return response.json(statement);
});

app.post("/withdraw", verifyIfAcountExists, (request, response) => {
  const { customer } = request;
  const { amount } = request.body;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperations = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperations);

  return response.status(201).json();
});

app.get("/customerBalance", verifyIfAcountExists, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.put("/account", verifyIfAcountExists, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(201).json();
});

app.delete("/account", verifyIfAcountExists, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(204).json();
});

app.listen(PORT, () => console.log("Is Running! ^ . ^"));
