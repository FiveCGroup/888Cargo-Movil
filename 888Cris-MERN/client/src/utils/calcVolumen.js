export function calcularVolumenCM(l, a, h) {
    const largo = Number(l) || 0;
    const ancho = Number(a) || 0;
    const alto = Number(h) || 0;
    return Number(((largo * ancho * alto) / 1000000).toFixed(3)); // m3
}

export function calcularVolumenMT(l, a, h) {
    const largo = Number(l) || 0;
    const ancho = Number(a) || 0;
    const alto = Number(h) || 0;
    return Number((largo * ancho * alto).toFixed(3)); // m3 si pasan en metros
}

export function calcularVolumenDesdeForm(form) {
    // si volumen manual está presente, usarlo
    if (form.volumenManual) return Number(form.volumenManual);
    // priorizar cm si están
    if (form.largoCm || form.anchoCm || form.altoCm) {
        return calcularVolumenCM(form.largoCm, form.anchoCm, form.altoCm);
    }
    // si usan metros
    if (form.largoMt || form.anchoMt || form.altoMt) {
        return calcularVolumenMT(form.largoMt, form.anchoMt, form.altoMt);
    }
    return 0;
}