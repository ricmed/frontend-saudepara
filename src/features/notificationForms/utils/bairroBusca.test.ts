import { bairroCorrespondeBusca } from './bairroBusca';

describe('bairroCorrespondeBusca', () => {
  it('acha Nazaré quando a busca veio sem acento e em maiúsculas', () => {
    expect(bairroCorrespondeBusca('Nazaré', 'NAZARE')).toBe(true);
    expect(bairroCorrespondeBusca('Nazaré', 'naz')).toBe(true);
    expect(bairroCorrespondeBusca('Guamá', 'guama')).toBe(true);
  });

  it('não casa um nome diferente', () => {
    expect(bairroCorrespondeBusca('Nazaré', 'jurunas')).toBe(false);
  });
});
