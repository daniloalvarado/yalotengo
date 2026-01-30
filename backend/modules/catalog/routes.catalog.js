import { Router } from 'express'
import { Op } from 'sequelize'
import { Product } from './model.product.js'
import { Category } from './model.category.js'
import { auth } from '../../utils/jwt.js'

const r = Router()

// 📦 Catálogo público (sin auth)
// GET /products (público)
r.get('/products', async (req,res)=>{
  const { search, cat, kind } = req.query;

  const where = { pro_bol_active: true };

  if (search) where.pro_txt_name = { [Op.like]: `%${search}%` };
  if (cat) where.cat_int_id = cat;

  // 🔎 Filtro por tipo
  if (kind === 'LIBRO') {
    // Define tu lógica de LIBRO; dos opciones:
    // A) Si tienes columna explícita:
    // where.pro_txt_kind = 'LIBRO';

    // B) Si te basas en virtual:
    where[Op.or] = [
      { pro_bol_virtual: true },
      { pro_txt_kind: 'LIBRO' }
    ];
  }
  if (kind === 'ARTICULO') {
    // A) con columna explícita:
    // where.pro_txt_kind = 'ARTICULO';

    // B) con lógica inversa a libro:
    where[Op.and] = [
      { [Op.or]: [{ pro_bol_virtual: null }, { pro_bol_virtual: false }] },
      { pro_txt_kind: { [Op.ne]: 'LIBRO' } },
    ];
  }

  const items = await Product.findAll({
    where,
    limit: 50,
    attributes: [
      'pro_int_id',
      'pro_txt_name',
      'pro_txt_desc',
      'pro_dec_price',
      'pro_txt_slug',
      'pro_txt_kind',
      'pro_bol_virtual',
      'cat_int_id',
      'pro_txt_image',
    ],
    order: [['pro_int_id','DESC']]
  });

  res.json(items);
});

// 🛠️ Administración (sí requiere auth)
r.post('/categories', auth, async (req,res)=>{
  const { name, slug } = req.body
  const c = await Category.create({
    cat_txt_name: name,
    cat_txt_slug: slug
  })
  res.json(c)
})

r.post('/products', auth, async (req,res)=>{
  const body = req.body
  const p = await Product.create({
    pro_txt_name: body.name,
    pro_txt_slug: body.slug,
    pro_txt_desc: body.desc || '',
    pro_dec_price: body.price,
    pro_bol_virtual: !!body.virtual,
    pro_txt_filekey: body.fileKey || null,
    pro_int_stock: body.stock || null,
    pro_int_stock_min: body.stockMin || 0,
    cat_int_id: body.catId,
    pro_bol_active: true
  })
  res.json(p)
})

export default r
