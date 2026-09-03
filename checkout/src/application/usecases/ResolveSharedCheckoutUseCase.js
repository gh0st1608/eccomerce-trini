export class ResolveSharedCheckoutUseCase {
  constructor({ checkoutShareLinkService }) {
    this.checkoutShareLinkService = checkoutShareLinkService;
  }

  execute(token) {
    return this.checkoutShareLinkService.resolveToken(token);
  }
}
