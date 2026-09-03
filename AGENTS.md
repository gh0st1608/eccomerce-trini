# AGENTS.md

## Workspace
Este workspace agrupa dos proyectos relacionados:
- `ecommerce/`: storefront, catalogo, carrito y checkout.
- `admin/`: panel administrativo, operacion y gestion interna.

## Objetivo
Trabajar con contexto separado por proyecto, evitando mezclar reglas, dependencias, patrones o decisiones entre `ecommerce` y `admin`.

## Reglas globales
- Confirmar en que carpeta se va a trabajar antes de hacer cambios amplios.
- Mantener los cambios limitados al proyecto objetivo salvo que la tarea pida coordinacion entre ambos.
- No reutilizar componentes, servicios o dependencias entre proyectos sin verificar primero que formen parte de una libreria compartida real.
- Seguir la estructura y estilo existentes dentro de cada proyecto.
- Mantener cambios pequenos, enfocados y faciles de revisar.

## Prioridad de instrucciones
- Este archivo define reglas compartidas del workspace.
- `ecommerce/AGENTS.md` aplica con prioridad dentro de `ecommerce/`.
- `admin/AGENTS.md` aplica con prioridad dentro de `admin/`.

## Verificacion
- Ejecutar solo las validaciones relevantes al proyecto modificado.
- Si una tarea toca ambos proyectos, validar cada uno por separado.
