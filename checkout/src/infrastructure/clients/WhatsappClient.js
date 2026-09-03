export class WhatsappClient {
  constructor({ whatsappPhone }) {
    this.whatsappPhone = whatsappPhone;
  }

  buildLink(message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${this.whatsappPhone}?text=${encodedMessage}`;
  }
}
