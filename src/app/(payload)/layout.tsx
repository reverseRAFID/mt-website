/* THIS FILE IS PART OF PAYLOAD'S ADMIN SHELL.
 *
 * It is a SECOND root layout, sitting alongside src/app/(frontend)/layout.tsx.
 * Payload's RootLayout renders its own <html> and <body>, so the admin UI must
 * not be nested inside the website's layout — hence the two route groups and no
 * layout at src/app/ itself.
 */
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'

import '@payloadcms/next/css'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
