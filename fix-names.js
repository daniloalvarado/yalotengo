const fs = require('fs');
const files = [
  'backend/modules/models3d/routes.models3d.js',
  'backend/modules/books/routes.books.js',
  'backend/modules/courses/routes.courses.js',
  'backend/modules/cart/routes.cart.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/customerName: user \? \`\$\{user\.use_txt_nombres\} \$\{user\.use_txt_apellidos\}\` : 'Usuario Registrado'/g, "customerName: (user && user.use_txt_nombres) ? `${user.use_txt_nombres} ${user.use_txt_apellidos}` : (user && user.email) ? user.email : 'Usuario Registrado'");
  fs.writeFileSync(f, content);
  console.log('Updated ' + f);
});
