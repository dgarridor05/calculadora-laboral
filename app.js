/**
 * CalculaTuFiniquito.es - Lógica de Cálculo Laboral (España)
 * Basado en el Estatuto de los Trabajadores y jurisprudencia laboral vigente.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('finiquito-form');
    const resultadoPanel = document.getElementById('resultado-panel');
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookiesBtn = document.getElementById('accept-cookies');

    // Inicializar fechas con valores por defecto útiles (último año)
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');

    const hoy = new Date();
    const haceUnAno = new Date();
    haceUnAno.setFullYear(hoy.getFullYear() - 1);

    fechaInicioInput.value = haceUnAno.toISOString().split('T')[0];
    fechaFinInput.value = hoy.toISOString().split('T')[0];

    // Gestión del Banner de Cookies
    if (!localStorage.getItem('cookiesAceptadas')) {
        cookieBanner.style.display = 'block';
    }

    acceptCookiesBtn.addEventListener('click', () => {
        localStorage.setItem('cookiesAceptadas', 'true');
        cookieBanner.style.display = 'none';
    });

    // Envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calcularFiniquito();
    });

    function calcularFiniquito() {
        const salarioMensual = parseFloat(document.getElementById('salario').value) || 0;
        const numPagas = parseInt(document.getElementById('num-pagas').value, 10);
        const fechaInicio = new Date(document.getElementById('fecha-inicio').value);
        const fechaFin = new Date(document.getElementById('fecha-fin').value);
        const tipoCese = document.getElementById('tipo-cese').value;
        const vacacionesDisfrutadas = parseFloat(document.getElementById('vacaciones-disfrutadas').value) || 0;
        const preaviso = document.getElementById('preaviso').value;

        if (fechaFin < fechaInicio) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }

        // 1. Salario Anual y Salario Diario
        const salarioAnual = salarioMensual * numPagas;
        const salarioDiario = salarioAnual / 365;

        // 2. Antigüedad en días y años
        const diferenciaTiempo = fechaFin.getTime() - fechaInicio.getTime();
        const diasAntiguedad = Math.floor(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
        const anosAntiguedad = diasAntiguedad / 365.25;

        // 3. Salario de los días trabajados en el mes de salida
        const diaFinMes = fechaFin.getDate();
        // Según convenio, el mes se prorratea habitualmente a 30 días o días reales
        const salarioMesActual = (salarioMensual / 30) * Math.min(diaFinMes, 30);

        // 4. Vacaciones no disfrutadas del año en curso
        // El año laboral para vacaciones va del 1 de enero al 31 de diciembre
        const anoSalida = fechaFin.getFullYear();
        const inicioAnoSalida = new Date(anoSalida, 0, 1);
        const inicioComputoVacaciones = fechaInicio > inicioAnoSalida ? fechaInicio : inicioAnoSalida;

        const diasTrabajadosEsteAno = Math.floor((fechaFin - inicioComputoVacaciones) / (1000 * 3600 * 24)) + 1;
        // 30 días de vacaciones naturales al año = 2.5 días por mes (30 / 365 días)
        const diasVacacionesGenerados = (diasTrabajadosEsteAno / 365) * 30;
        const diasVacacionesPendientes = Math.max(0, diasVacacionesGenerados - vacacionesDisfrutadas);
        const importeVacaciones = diasVacacionesPendientes * salarioDiario;

        // 5. Pagas extraordinarias (si no están prorrateadas)
        let importePagasExtra = 0;
        let descripcionPagas = 'Pagas prorrateadas mes a mes en nómina';

        if (numPagas === 14) {
            // Devengo semestral habitual:
            // Paga de verano (1 enero a 30 junio)
            // Paga de navidad (1 julio a 31 diciembre)
            const mesFin = fechaFin.getMonth(); // 0 a 11
            const diaDelMes = fechaFin.getDate();

            let diasDevengoPagaActual = 0;
            let nombrePagaActual = '';

            if (mesFin < 6) {
                // Primer semestre (Paga de Verano)
                nombrePagaActual = 'Verano';
                const inicioSemestre = new Date(anoSalida, 0, 1);
                diasDevengoPagaActual = Math.floor((fechaFin - inicioSemestre) / (1000 * 3600 * 24)) + 1;
            } else {
                // Segundo semestre (Paga de Navidad)
                nombrePagaActual = 'Navidad';
                const inicioSemestre = new Date(anoSalida, 6, 1);
                diasDevengoPagaActual = Math.floor((fechaFin - inicioSemestre) / (1000 * 3600 * 24)) + 1;
            }

            // Cada paga extra equivale a 1 mensualidad de salario base
            const importeUnaPaga = salarioMensual;
            importePagasExtra = (importeUnaPaga / 182.5) * Math.min(diasDevengoPagaActual, 182.5);
            descripcionPagas = `Parte proporcional de paga de ${nombrePagaActual} (${Math.round(diasDevengoPagaActual)} días)`;
        }

        // 6. Indemnización según tipo de cese
        let diasPorAno = 0;
        let topeMensualidades = 0;
        let descripcionIndemnizacion = 'Sin derecho a indemnización';

        switch (tipoCese) {
            case 'improcedente':
                diasPorAno = 33;
                topeMensualidades = 24;
                descripcionIndemnizacion = `33 días/año (Antigüedad: ${anosAntiguedad.toFixed(2)} años)`;
                break;
            case 'objetivo':
                diasPorAno = 20;
                topeMensualidades = 12;
                descripcionIndemnizacion = `20 días/año (Antigüedad: ${anosAntiguedad.toFixed(2)} años)`;
                break;
            case 'temporal':
                diasPorAno = 12;
                topeMensualidades = 12;
                descripcionIndemnizacion = `12 días/año fin de contrato temporal`;
                break;
            case 'baja_voluntaria':
                descripcionIndemnizacion = 'Baja voluntaria (Sin indemnización)';
                break;
            case 'periodo_prueba':
                descripcionIndemnizacion = 'No superación de prueba (Sin indemnización)';
                break;
            case 'disciplinario':
                descripcionIndemnizacion = 'Despido disciplinario (Sin indemnización)';
                break;
        }

        let importeIndemnizacion = 0;
        if (diasPorAno > 0) {
            const diasIndemnizacionTotales = (diasAntiguedad / 365) * diasPorAno;
            let calculoBruto = diasIndemnizacionTotales * salarioDiario;

            // Aplicar tope legal de mensualidades
            const salarioMensualPromedio = salarioAnual / 12;
            const topeMaximo = salarioMensualPromedio * topeMensualidades;
            importeIndemnizacion = Math.min(calculoBruto, topeMaximo);
        }

        // 7. Indemnización por falta de preaviso
        let importePreaviso = 0;
        const cardPreavisoContainer = document.getElementById('card-preaviso-container');
        if (preaviso === 'no' && tipoCese === 'objetivo') {
            importePreaviso = salarioDiario * 15;
            cardPreavisoContainer.style.display = 'flex';
            document.getElementById('res-preaviso').textContent = formatearMoneda(importePreaviso);
        } else {
            cardPreavisoContainer.style.display = 'none';
        }

        // 8. Total Finiquito Bruto
        const totalLiquidacion = salarioMesActual + importeVacaciones + importePagasExtra + importeIndemnizacion + importePreaviso;

        // Renderizar en el DOM
        document.getElementById('res-total').textContent = formatearMoneda(totalLiquidacion);
        document.getElementById('res-indemnizacion').textContent = formatearMoneda(importeIndemnizacion);
        document.getElementById('res-indemnizacion-dias').textContent = descripcionIndemnizacion;

        document.getElementById('res-dias-mes').textContent = formatearMoneda(salarioMesActual);
        document.getElementById('res-dias-mes-dias').textContent = `${diaFinMes} días trabajados en el mes`;

        document.getElementById('res-vacaciones').textContent = formatearMoneda(importeVacaciones);
        document.getElementById('res-vacaciones-dias').textContent = `${diasVacacionesPendientes.toFixed(1)} días de vacaciones pendientes`;

        document.getElementById('res-pagas').textContent = formatearMoneda(importePagasExtra);
        document.getElementById('res-pagas-desc').textContent = descripcionPagas;

        // Mostrar panel y hacer scroll suave
        resultadoPanel.style.display = 'block';
        resultadoPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function formatearMoneda(valor) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }
});
