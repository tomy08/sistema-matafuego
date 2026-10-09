import { describe, expect, it } from "vitest";
import { decodeAgcParam, parseAgcHtml, validarUrlAgc } from "./agc";

const HTML_EJEMPLO = `<table><tr><td class='frTextoTabla'>Domicilio instalaci&oacute;n</td>
<td class='frTextoTablaRegistroInfo'>LOPE DE VEGA AV. 2150 </td><td class='frTextoTabla'>Empresa fabricante</td>
<td class='frTextoTablaRegistroInfo'>Matafuegos Donny S.R.L</td></tr><tr><td class='frTextoTabla'>Empresa recargadora</td>
<td class='frTextoTablaRegistroInfo'>SUYAI EXTINTORES S.R.L.</td><td class='frTextoTabla'>Fecha mantenimiento</td>
<td class='frTextoTablaRegistroInfo'>08/2026</td></tr><tr><td class='frTextoTabla'>Fecha vencimiento mantenimiento</td>
<td class='frTextoTablaRegistroInfo'>08/2027</td><td class='frTextoTabla'>Fecha fabricaci&oacute;n</td>
<td class='frTextoTablaRegistroInfo'>12/2008</td></tr><tr><td class='frTextoTabla'>Fecha vencimiento vida util</td>
<td class='frTextoTablaRegistroInfo'>12/2028</td><td class='frTextoTabla'>Fecha vencimiento PH</td>
<td class='frTextoTablaRegistroInfo'>08/2028</td></tr><tr><td class='frTextoTabla'>Nro. tarjeta</td>
<td class='frTextoTablaRegistroInfo'>1041950779</td><td class='frTextoTabla'>Agente extintor</td>
<td class='frTextoTablaRegistroInfo'>Haloclean</td></tr><tr><td class='frTextoTabla'>Capacidad</td>
<td class='frTextoTablaRegistroInfo'>5 Kg/Lts</td><td class='frTextoTabla'>Nro. extintor</td>
<td class='frTextoTablaRegistroInfo'>81174</td></tr><tr><td class='frTextoTabla'>Uso</td>
<td class='frTextoTablaRegistroInfo'>Particular</td></tr></table>`;

describe("agc", () => {
  it("decodifica parámetros hex(base64)", () => {
    expect(decodeAgcParam("4d5459324e4449774d544d3d")).toBe("16642013");
    expect(decodeAgcParam("4f5467314e4441344e513d3d")).toBe("9854085");
  });

  it("valida solo host AGC", () => {
    expect(() =>
      validarUrlAgc("https://evil.com/matafuegos/datosEstampilla.jsp?p_tarjeta=a&p_var=b&p_var2=c"),
    ).toThrow();
    const url = validarUrlAgc(
      "https://dghpsh.agcontrol.gob.ar/matafuegos/datosEstampilla.jsp?p_tarjeta=4d5459324e4449774d544d3d&p_var=4d5459324e444d784e7a553d&p_var2=4f5467314e4441344e513d3d",
    );
    expect(url.hostname).toBe("dghpsh.agcontrol.gob.ar");
  });

  it("parsea el HTML real de AGC", () => {
    const d = parseAgcHtml(HTML_EJEMPLO);
    expect(d.nroTarjeta).toBe("1041950779");
    expect(d.agente).toBe("Haloclean");
    expect(d.capacidad).toBe("5 Kg/Lts");
    expect(d.nroExtintor).toBe("81174");
    expect(d.empresaRecargadora).toBe("SUYAI EXTINTORES S.R.L.");
    expect(d.fechaMantenimiento).toBe("08/2026");
    expect(d.vencMantenimiento).toBe("08/2027");
    expect(d.domicilioInstalacion).toBe("LOPE DE VEGA AV. 2150");
  });
});
