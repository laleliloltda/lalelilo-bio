/* LOJAS — para adicionar ou editar uma loja, mexa só nesta lista.
   [estado, nome, link do WhatsApp, link do Grupo VIP, [latitude, longitude], endereço]
   · estado: 'PE' | 'PB' | 'AL'   ·   use '#' se ainda não houver link
   · latitude/longitude: no Google Maps, clique com o botão direito em cima da loja e clique nos números
     que aparecem (eles são copiados). Ex.: [-8.08598, -34.89414]
   · endereço no formato 'Rua, número - Bairro, Cidade' (o que vem depois do último ' - ' aparece como bairro e cidade) */

export type UF = 'PE' | 'PB' | 'AL'

export interface Loja {
  id: number
  uf: UF
  nome: string
  wa: string
  vip: string
  lat: number
  lng: number
  endereco: string
}

type Linha = [UF, string, string, string, [number, number], string]

// prettier-ignore
const LINHAS: Linha[] = [
  ['PE','Abreu e Lima','https://api.whatsapp.com/send?phone=5581999350412&text=Oi,%20quero%20fazer%20o%20pedido%20de%20um%20combo%20LALELILO!','https://chat.whatsapp.com/L5gIanaa4KkI8M97PYdN4M',[-7.90664,-34.90137],'Av. Duque de Caxias, 876 - Centro, Abreu e Lima'],
  ['PE','Afogados','https://wa.me/5581988316193','https://chat.whatsapp.com/DOro37UFpBh47OSJTgBK2U?s=cl&p=a&mlu=4&ilr=4',[-8.08016,-34.90852],'R. São Miguel, 176 - Afogados, Recife'],
  ['PE','Afogados da Ingazeira','https://wa.link/82p750','https://chat.whatsapp.com/I3pyIrP5Ic6ETMWUvF9DOO?s=cl&p=i&mlu=4&ilr=4&iam=2',[-7.74607,-37.63939],'Av. Manoel Borba - Centro, Afogados da Ingazeira'],
  ['PE','Aldeia (Loja de Fábrica)','http://wa.link/eqm3nz','https://chat.whatsapp.com/DbU9e77POgMHtq0am6WVHE',[-7.96968,-35.00187],'Estrada de Aldeia, 10204 (km 11) - Aldeia dos Camarás, Camaragibe'],
  ['PE','Aldeia (Vera Cruz)','https://wa.me/558199114912','https://chat.whatsapp.com/IsNfXweoaooJIcLOXdjvjM',[-7.95594,-35.00549],'R. Marcela de Andrade Lima, 110 - Vera Cruz, Camaragibe'],
  ['PE','Arcoverde','http://wa.link/u99uvq','https://chat.whatsapp.com/JDuR5YYxksXDxFY7uoR4FS',[-8.41967,-37.05359],'Av. Cel. Antônio Japiassú, 513 - Centro, Arcoverde'],
  ['PE','Belo Jardim','https://wa.link/86muae','https://chat.whatsapp.com/IWAo24MbHWCHIX0NBDIn7F?mode=wwt',[-8.33766,-36.42786],'R. Tenente Cleto Campelo, 162 - Centro, Belo Jardim'],
  ['PE','Carpina','https://contate.me/lalelilo','https://chat.whatsapp.com/EUAOVRfF5pCD1HzOrTzXw7',[-7.84287,-35.25544],'R. Bernardo Vieira de Melo, 43 A - São José, Carpina'],
  ['PE','Casa Amarela','https://wa.me/message/CVQHFVDWOJLEK1','https://chat.whatsapp.com/DXg23q6J8k11I3DLwpeEn8',[-8.02111,-34.92175],'R. Padre Lemos, 823 - Casa Amarela, Recife'],
  ['PE','Centro de Camaragibe','https://wa.me/558198828777','https://chat.whatsapp.com/K8yxBcXKxrsFigzhytSJ9S',[-8.01888,-34.98307],'R. Vila Nova, 50 - Centro, Camaragibe'],
  ['PE','Centro de Caruaru','https://wa.link/rd8x8c','https://chat.whatsapp.com/IpzuJ3sSdC9GwS8qLgBG8N',[-8.29015,-35.97421],'Av. Lourival José da Silva, 592 - Centro, Caruaru'],
  ['PE','Centro do Recife','http://wa.link/lo353z','https://chat.whatsapp.com/FF4Zuvfe8wu25nhyCrUPC6',[-8.06997,-34.87805],'R. Santa Rita, 215 - São José, Recife'],
  ['PE','Escada','https://wa.me/5581987206169','https://chat.whatsapp.com/L57llslzUvH8J4QlvC75xQ?s=cl&p=a&iam=2',[-8.35714,-35.22440],'Av. Comendador José Pereira, 296 - Bela Vista, Escada'],
  ['PE','Garanhuns','http://wa.link/6whgcl','https://chat.whatsapp.com/CpNlqmH4PKdI1roGs4ia7P',[-8.89053,-36.49532],'R. Santos Dumont, 40 - Santo Antônio, Garanhuns'],
  ['PE','Goiana','https://wa.link/aht7pl','https://chat.whatsapp.com/E5Ym9z4t9ACKrqpdjgaQ8V?mode=ems_wa_c',[-7.56301,-35.01314],'R. da Misericórdia, 88 - Centro, Goiana'],
  ['PE','Gravatá','http://wa.link/hisln2','https://chat.whatsapp.com/C9cvMzozmk661UKnClTXJX',[-8.20412,-35.57013],'R. Tenente Cleto Campelo, 27 - Centro, Gravatá'],
  ['PE','Ipojuca','https://wa.link/fb8lgq','https://chat.whatsapp.com/KwJf2R4mMjG2pZ3qlv8I2H?mode=gi_t',[-8.39932,-35.06328],'Praça Getúlio Vargas, 40 - Ipojuca'],
  ['PE','Piedade','https://api.whatsapp.com/send?phone=5581997570412&text=Ol%C3%A1,%20gostaria%20de%20ver%20os%20modelos%20dispon%C3%ADveis!','https://chat.whatsapp.com/GmgOH6fG38tAkJtvE8Fotv',[-8.15417,-34.91986],'Av. Zequinha Barreto, 412-A - Piedade, Jaboatão dos Guararapes'],
  ['PE','Recife Outlet','https://wa.me/5581981827611','https://chat.whatsapp.com/I12LFWchpqYGxS4lTT4smm?s=cl&p=i&mlu=4&ilr=4&iam=2',[-8.09576,-35.06797],'Rodovia Luiz Gonzaga (BR-232) - Pedreiras, Moreno'],
  ['PE','São Lourenço','https://wa.link/zfm7vd','https://chat.whatsapp.com/IFZz4eefxXJFoxkdTyXpMj',[-7.99617,-35.03770],'Av. Dr. Francisco Correia, 560 - Centro, São Lourenço da Mata'],
  ['PE','Serra Talhada','https://wa.link/2fxmmz','https://chat.whatsapp.com/Jf6x8NGKUYvDNqAK8iysIe',[-7.99168,-38.29992],'Praça Dr. Sérgio Magalhães, 828 - Centro, Serra Talhada'],
  ['PE','Surubim','https://wa.me/5581987343343','https://chat.whatsapp.com/LcBcocKCurZ9HJajFCuvtg?s=qt&p=i&mlu=4&ilr=4',[-7.83671,-35.75954],'R. Quinze de Novembro, 63 - Centro, Surubim'],
  ['PE','Shopping Boa Vista','http://wa.link/vez3ie','https://chat.whatsapp.com/DHDrsgzOwu25tyUFG7PXTN',[-8.06007,-34.88798],'R. do Giriquiti, 48 - Boa Vista, Recife'],
  ['PE','Shopping Camará','http://wa.link/me6cp9','https://chat.whatsapp.com/JYK01rkTQ3RGg6zABChiSw',[-8.01630,-34.97764],'R. Manoel Honorato da Costa, 555 - Vila da Fábrica, Camaragibe'],
  ['PE','Shopping Caruaru','http://wa.link/uohpl5','https://chat.whatsapp.com/FDSC5ju5HO01sqKVtQ0LuE',[-8.29524,-35.95187],'Av. Adjar da Silva Casé, 800 - Indianópolis, Caruaru'],
  ['PE','Shopping Costa Dourada','https://wa.me/5581985953129','https://chat.whatsapp.com/L9A20B5Dp6H3xPtcVmHTBV?s=sw&p=i&mlu=4&ilr=4&iam=2',[-8.30580,-35.02238],'PE-060, 3200 - Garapu, Cabo de Santo Agostinho'],
  ['PE','Shopping Guararapes','https://wa.me/5581997500235','https://chat.whatsapp.com/H9T6CMRrwF60VTbqI2brlc?mode=gi_t',[-8.16689,-34.91682],'Av. Barreto de Menezes, 800 - Piedade, Jaboatão dos Guararapes'],
  ['PE','Shopping Igarassu','https://wa.me/5581995982867','https://chat.whatsapp.com/IX5D4wGL3v61CIOTmCkl3U?s=sw&p=i&mlu=4&ilr=4',[-7.82748,-34.90895],'PE-035, 482 - Centro, Igarassu'],
  ['PE','Shopping North Way Paulista','http://wa.link/vpvpoh','https://chat.whatsapp.com/Ii0uRTYwj3CAotYmiyuhTe?s=cl&p=i&ilr=2&amv=2',[-7.93857,-34.87724],'Rodovia PE-15, km 16,5, nº 242 - Centro, Paulista'],
  ['PE','Shopping Patteo Olinda','http://wa.link/a4cax9','https://chat.whatsapp.com/H6VuiYnVzPM7OttIrpRKXS',[-7.99397,-34.84076],'R. Carmelita Muniz de Araújo, 225 - Casa Caiada, Olinda'],
  ['PE','Shopping RioMar Recife','https://wa.link/73omvk','https://chat.whatsapp.com/FRM2zG800D6AWvl6CYcuLs?mode=gi_t',[-8.08598,-34.89414],'Av. República do Líbano, 251 - Pina, Recife'],
  ['PE','Shopping Tacaruna','https://wa.me/5581973441638','https://chat.whatsapp.com/D8XbvCYEqYk56gNjSGY8pz?s=sh&p=i&mlu=0&ilr=0',[-8.03805,-34.87194],'Av. Gov. Agamenon Magalhães, 153 - Santo Amaro, Recife'],
  ['PE','Vitória de Santo Antão','https://wa.link/idkpbg','https://chat.whatsapp.com/Cz2X7kDaUAFD1r9uWK42jx',[-8.12101,-35.29512],'Av. Mariana Amélia, 23 - Centro, Vitória de Santo Antão'],
  ['AL','Arapiraca (Centro)','https://wa.me/5582996997722','https://chat.whatsapp.com/BBXGjPbLcjDGdIXhJIzHDg?mode=gi_t',[-9.75357,-36.65994],'R. Prof. Domingos Correia, 210 - Centro, Arapiraca'],
  ['AL','Arapiraca Prime','https://wa.me/5582999659425','https://chat.whatsapp.com/BadIqfWma2QLNbPhcCYTwi?s=cl&p=i&mlu=4&ilr=4&iam=2',[-9.74567,-36.64331],'Av. Deputada Ceci Cunha, 1302B - Nova Horizonte, Arapiraca'],
  ['AL','Maceió','http://wa.link/37g8aa','https://chat.whatsapp.com/DQ2E37Q0NCR6zESvKYiXJS?s=cl&p=i&mlu=4&ilr=4&iam=2',[-9.66189,-35.73828],'R. do Comércio, 406 - Centro, Maceió'],
  ['PB','Shopping Partage (Campina Grande)','https://wa.me/5583999840560','https://chat.whatsapp.com/L40cLmigx3m6zTIOjqNyN8?mode=gi_t',[-7.23532,-35.87012],'Av. Pref. Severino Bezerra Cabral, 1050, loja 2044 - Catolé, Campina Grande'],
  ['PB','Shopping Manaíra (João Pessoa)','https://wa.me/5583999480205','https://chat.whatsapp.com/K8I63kMIUiaJmL7iNeq6ae',[-7.09888,-34.84512],'R. Manoel Arruda Cavalcante, 805 - Manaíra, João Pessoa'],
]

export const ESTADOS: Record<UF, string> = { PE: 'Pernambuco', PB: 'Paraíba', AL: 'Alagoas' }
export const ORDEM_UF: UF[] = ['PE', 'PB', 'AL']

export const LOJAS: Loja[] = LINHAS.map(([uf, nome, wa, vip, [lat, lng], endereco], id) => ({
  id,
  uf,
  nome,
  wa,
  vip,
  lat,
  lng,
  endereco,
}))
