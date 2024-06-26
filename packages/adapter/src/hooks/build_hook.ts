import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 *
 * The hook is responsible for launching the remix vite:build command when the application is built
 */
export default async function remixBuildHook({ logger }: Parameters<AssemblerHookHandler>[0]) {
  logger.info('building remix app with vite')
  await runCommand('npx remix vite:build')
  // const cli = await import('@remix-run/dev')
  // await cli.run(['vite:build'])
  fs.mkdirSync('build/public/assets', { recursive: true })
  const source = 'build/remix/client'
  const target = 'build/public/assets'

  copyDirectorySync(source, target)
}

function copyDirectorySync(source: string, target: string) {
  fs.mkdirSync(target, { recursive: true })

  const entries = fs.readdirSync(source, { withFileTypes: true })

  for (let entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      copyDirectorySync(sourcePath, targetPath)
    } else {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

async function runCommand(command: string, args = []) {
  return new Promise((resolve, reject) => {
    const subprocess = spawn(command, args, { shell: true })
    let stdout = ''
    let stderr = ''

    subprocess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    subprocess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    subprocess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`))
      }
    })

    subprocess.on('error', (err) => {
      reject(new Error(`Failed to start command: ${err.message}`))
    })
  })
}
