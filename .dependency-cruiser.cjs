/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-external-deps',
      comment:
        'domain/ no importa nada externo (ni NestJS ni Drizzle ni ningún paquete de node_modules). ' +
        'Es lo que permite compilarlo y probarlo sin framework, sin base de datos y sin red. Los ' +
        '*.spec.ts quedan exentos: ahí sí se importa vitest, es la prueba misma.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain', pathNot: '\\.spec\\.ts$' },
      to: { path: 'node_modules', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'application-only-imports-domain',
      comment:
        'application/ sólo puede importar de su propio domain/ (más utilidades compartidas), ' +
        'nunca de infrastructure/ — ni la propia ni la de otro módulo.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/application' },
      to: {
        path: '^src/modules/[^/]+/infrastructure',
      },
    },
    {
      name: 'no-cross-module-infrastructure-imports',
      comment:
        'Ningún módulo importa la infrastructure/ de otro módulo — sólo lo que ese otro módulo ' +
        'exporta en su index.ts público. Así se puede extraer un módulo sin tocar a los demás.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/(?!\\1)([^/]+)/infrastructure',
      },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
    doNotFollow: { path: 'node_modules' },
  },
};
