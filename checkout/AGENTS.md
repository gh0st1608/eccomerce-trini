# AGENTS.md

## Proyecto
Aplicacion de ecommerce orientada a clientes finales.

## Alcance
- Busqueda y navegacion
- Carrito y checkout
- Cuenta de usuario y experiencia de compra

Nota: el catalogo (productos, categorias) y las tiendas ya no se administran ni se almacenan aqui.
Esa data vive en `admin` (API de solo lectura publica + CRUD protegido). Este backend solo consume
ese catalogo para armar el checkout de WhatsApp (no expone endpoints propios de productos/categorias).

## Reglas de trabajo
- Priorizar experiencia de usuario, claridad visual y rendimiento percibido.
- No introducir patrones administrativos o flujos internos del panel `admin`.
- Mantener consistencia en naming, rutas y componentes del storefront.
- Cuidar especialmente regresiones en carrito, precios, stock visible y checkout.

## Expectativas para cambios
- Preferir componentes reutilizables solo dentro del dominio ecommerce, salvo que exista una capa compartida formal.
- Mantener el impacto de estilos y layout acotado.
- Agregar pruebas o validaciones cuando la logica de compra, precios o estado del carrito cambie.

## Verificacion sugerida
- Desarrollo: comando del proyecto ecommerce
- Lint: comando del proyecto ecommerce
- Tests: comando del proyecto ecommerce
- Build: comando del proyecto ecommerce
