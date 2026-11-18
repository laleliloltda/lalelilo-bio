// Publica o site no GitHub Pages: confere (lint + testes), compila e envia a pasta dist para a branch gh-pages.
// Uso: npm run publicar   (o GitHub Pages do repositório serve a branch gh-pages, raiz; domínio no arquivo public/CNAME)
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const rodar = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts })
const saida = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', ...opts }).trim()

const origem = saida('git config --get remote.origin.url')
const versao = saida('git rev-parse --short HEAD')
if (saida('git status --porcelain'))
  console.warn('Atenção: há mudanças sem commit; publicando mesmo assim o que está na pasta.')

rodar('npm run lint')
rodar('npm test')
rodar('npm run build')
if (!existsSync('dist/index.html') || !existsSync('dist/CNAME'))
  throw new Error('dist incompleto (falta index.html ou CNAME)')

const pasta = mkdtempSync(join(tmpdir(), 'bio-pages-'))
try {
  cpSync('dist', pasta, { recursive: true })
  writeFileSync(join(pasta, '.nojekyll'), '')
  rodar('git init -q -b gh-pages', { cwd: pasta })
  rodar('git add -A', { cwd: pasta })
  rodar(
    `git -c user.name="Lalelilo Bio" -c user.email="laleliloltda@users.noreply.github.com" commit -q -m "Publicação do site (código ${versao})"`,
    {
      cwd: pasta,
    },
  )
  rodar(`git push -f "${origem}" gh-pages`, { cwd: pasta })
  console.log(
    `\nPublicado (${readdirSync(pasta).length} itens). O GitHub Pages atualiza em 1–2 minutos: https://bio.lalelilo.com.br`,
  )
} finally {
  rmSync(pasta, { recursive: true, force: true })
}
