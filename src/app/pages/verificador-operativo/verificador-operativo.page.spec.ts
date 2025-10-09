import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificadorOperativoPage } from './verificador-operativo.page';

describe('VerificadorOperativoPage', () => {
  let component: VerificadorOperativoPage;
  let fixture: ComponentFixture<VerificadorOperativoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificadorOperativoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
