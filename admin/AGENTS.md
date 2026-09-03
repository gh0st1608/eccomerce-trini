# AGENTS.md

## Proyecto
Panel administrativo para operacion y gestion del negocio.

## Alcance
- Gestion de catalogo
- Ordenes y estados
- Inventario
- Usuarios internos, reportes o configuracion operativa

## Reglas de trabajo
- Priorizar claridad operativa, productividad y seguridad de cambios.
- No introducir decisiones visuales o flujos pensados para clientes finales del `ecommerce`.
- Mantener formularios, tablas, filtros y acciones administrativas consistentes entre modulos.
- Cuidar especialmente permisos, edicion de datos, estados de orden e inventario.

## Expectativas para cambios
- Preferir interfaces estables y predecibles sobre efectos visuales innecesarios.
- Validar bien acciones destructivas o de alto impacto operativo.
- Agregar pruebas o validaciones cuando cambien flujos de edicion, permisos o sincronizacion de datos.

## Verificacion sugerida
- Desarrollo: comando del proyecto admin
- Lint: comando del proyecto admin
- Tests: comando del proyecto admin
- Build: comando del proyecto admin
