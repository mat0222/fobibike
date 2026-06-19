const productsService = require('../services/products.service');

async function create(req, res) {
  const product = await productsService.createProduct({
    category: req.body.category,
    code: req.body.code.trim(),
    name: req.body.name.trim(),
    type: req.body.type,
    price: Number(req.body.price),
    installmentPrice: Number(req.body.installmentPrice),
    stock: Number(req.body.stock),
    supplier: Number(req.body.supplier),
  });

  return res.status(201).json({
    success: true,
    message: 'Producto creado',
    data: product,
  });
}

async function getAll(req, res) {
  const products = await productsService.getAllProducts();
  return res.json({ success: true, data: products, total: products.length });
}

async function getByCategory(req, res) {
  const { category } = req.params;
  const products = await productsService.getProductsByCategory(category);
  return res.json({ success: true, data: products, total: products.length });
}

async function getTypes(req, res) {
  const { category } = req.params;
  const types = productsService.getTypesByCategory(category);
  return res.json({ success: true, data: types });
}

async function update(req, res) {
  const { category, code } = req.params;
  const { name, type, price, installmentPrice, stock, supplier } = req.body;

  const product = await productsService.updateProduct(category, code, {
    name: name.trim(),
    type,
    price: Number(price),
    installmentPrice: Number(installmentPrice),
    stock: Number(stock),
    supplier: Number(supplier),
  });

  return res.json({ success: true, message: 'Producto actualizado', data: product });
}

async function remove(req, res) {
  const { category, code } = req.params;
  await productsService.deleteProduct(category, code);
  return res.json({ success: true, message: 'Producto eliminado' });
}

module.exports = { create, getAll, getByCategory, getTypes, update, remove };
