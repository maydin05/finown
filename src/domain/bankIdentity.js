const brands = [
  ['enpara', 'enpara.png'], ['kuveytturk', 'kuveytturk.png'],
  ['isbank', 'isbank.jpg'], ['garanti', 'garanti.png'],
  ['akbank', 'akbank.ico'], ['ing', 'ing.png'],
  ['yapikredi', 'yapikredi.png'], ['qnb', 'qnb.ico'], ['ziraat', 'ziraat.ico'],
];
export function bankLogo(name = '') {
  const normalized=String(name).toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');
  const brand=brands.find(([key])=>key==='ing' ? ['ing','ingbank'].includes(normalized) : normalized.includes(key));
  return brand ? `/banks/${brand[1]}` : null;
}
// Resolve recorded relationships only. A title is not proof of a bank identity.
export function paymentBank(item,products=[],banks=[]) {
  if(item.productId==null || !['card','loan'].includes(item.type))return null;
  const product=products.find(p=>String(p.id)===String(item.productId));
  if(!product)return null;
  const parent=products.find(p=>product.parentCardId!=null && String(p.id)===String(product.parentCardId));
  const id=product.bankId ?? parent?.bankId;
  return id==null ? null : banks.find(b=>String(b.id)===String(id)) || null;
}
