import { routes } from '../../app.routes';

describe('Legal routes', () => {
  it('should expose public routes for terms, privacy and cancellation policy', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toContain('terminos-condiciones');
    expect(paths).toContain('politica-datos');
    expect(paths).toContain('politica-cancelacion');
  });
});
