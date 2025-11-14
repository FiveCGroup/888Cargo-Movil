import { useState, useEffect, useCallback } from "react";
import {useParams, useNavigate} from "react-router-dom";
import qrLandingService from "../services/qrLandingService";

export const useQRLanding = () => {
    const {qrCode} = useParams();
    const navigate = useNavigate();
    const [articuloData, setArticuloData] = useState(null);
    const [cargaData, setCargaData] = useState(null);
    const [seguimientoData, setSeguimientoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [mostrandoSeguimiento, setMostrandoSeguimiento] = useState(false);
    const [loadingSeguimiento, setLoadingSeguimiento] = useState(false);

    const cargarInformacionQR = useCallback(async () => {
        if (!qrCode) {
            setError('Código QR no válido.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const resultado = await qrLandingService.obtenerInfoPorQR(qrCode);

            if (resultado.success) {
                const {articulo, carga} = resultado.data;
                setArticuloData(articulo);
                setCargaData(carga);

                // registrar visualización no bloqueante (no interrumpe flujo si falla)
                try {
                    await qrLandingService.registrarVisualización(qrCode, {
                        userAgent: navigator.userAgent,
                        referrer: document.referrer
                    });
                } catch (e) {
                    console.warn('No se pudo registrar la visualización del QR:', e);
                }
            } else {
                if (resultado.notFound) {
                    setNotFound(true);
                } else {
                    setError(resultado.error);
                }
            }
        } catch (err) {
            console.error('Error cargando información del QR: ', err);
            setError('Error inesperado al cargar la información del QR.');
        } finally {
            setLoading(false);
        }
    }, [qrCode]);

    const cargarSeguimiento = useCallback(async () => {
        if (!cargaData?.id) return;

        try {
            setLoadingSeguimiento(true);
            const resultado = await qrLandingService.obtenerEstadoSeguimiento(cargaData.id);

            if (resultado.success) {
                setSeguimientoData(resultado.data);
                setMostrandoSeguimiento(true);
            } else {
                console.error('Error al obtener el estado de seguimiento: ', resultado.error);
            }
        } catch (err) {
            console.error('Error cargando seguimiento: ', err);
        } finally {
            setLoadingSeguimiento(false);
        }
    }, [cargaData]);

    const verVistaCompleta = () => {
        if (cargaData?.id) {
            navigate(`/packingList/${cargaData.id}`);
        }
    };

    const compartirQR = async () => {
        if (navigator.share && articuloData) {
            try {
                await navigator.share({
                    title: `Articulo: ${articuloData.descripcion}`,
                    text: `información del artículo: ${articuloData.descripcion} - carga ${cargaData?.codigo_carga}`,
                    url: window.location.href
                });
            } catch (shareErr) {
                console.warn('No se pudo compartir mediante Web Share API, intentado portapapeles:', shareErr);
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                        await navigator.clipboard.writeText(window.location.href);
                    } catch (e) {
                        console.warn('No se pudo copiar la URL al portapapeles:', e);
                    }
                }
            }
        }
    };

    useEffect(() => {
        cargarInformacionQR();
    }, [cargarInformacionQR]);

    return {
        qrCode,
        articuloData,
        cargaData,
        seguimientoData,
        loading,
        error,
        notFound,

        mostrandoSeguimiento,
        loadingSeguimiento,

        cargarInformacionQR,
        cargarSeguimiento,
        verVistaCompleta,
        compartirQR,
        navigate,

        setMostrandoSeguimiento
    };
};