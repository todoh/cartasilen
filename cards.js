// Definición de todas las cartas del juego
// Las rutas de las imágenes se toman de las variables definidas en imagenes.js

const cardDefinitions = [
    // Cartas de Valor Negativo (Especiales)
    { id: 'muerte', name: 'Muerte', value: -4.9, effect: 'Elige a un jugador, mira sus cartas y descarta 1. Si vale 0 o menos, avanzas 1 casilla.', count: 1, image: muerte },
    { id: 'avefenix', name: 'Ave Fénix', value: -3.3, effect: 'Descarta tu mano y roba 3 cartas.', count: 1, image: fenix },
    { id: 'gato', name: 'Gato', value: -3, effect: 'Roba 2 cartas.', count: 1, image: gato },
    { id: 'caballodetroya', name: 'Caballo de Troya', value: -2.6, effect: 'Elige a un jugador, ese jugador elige 1 de sus cartas y la descarta.', count: 1, image: troya },
    { id: 'ranadelasuerte', name: 'Rana de la Suerte', value: -2, effect: 'Avanza 2 casillas.', count: 1, image: rana },

    // Cartas de Valor Positivo (Comunes y Raras)
    { id: 'nini', name: 'Nini', value: 1, effect: 'Roba 1 carta.', count: 5, image: nini },
    { id: 'perro', name: 'Perro', value: 1.5, effect: 'Repites tu turno.', count: 2, image: perro },
    { id: 'esclavo', name: 'Esclavo', value: 1.8, effect: 'Si tienes una carta con valor > 4, muéstrala y avanza 1 casilla.', count: 3, image: esclavo },
    { id: 'loco', name: 'Loco', value: 2, effect: 'Duelo: ambos elegís 1 carta. El de mayor valor avanza 2 y el otro retrocede 1.', count: 2, image: loco },
    { id: 'vagabundo', name: 'Vagabundo', value: 2.2, effect: 'Compara tu carta más baja con la del rival. Si la tuya es menor, avanzas 2 casillas.', count: 2, image: vagabundo },
    { id: 'filosofo', name: 'Filósofo', value: 2.5, effect: 'Ambos robáis 1 carta. El de mayor valor la conserva, el otro la descarta.', count: 2, image: BASE64_IMAGE_PLACEHOLDER }, // No se encontró imagen para 'filosofo'
    { id: 'influencer', name: 'Influencer', value: 2.8, effect: 'Compara tu carta más alta con la del rival. Ganas: avanzas 1, rival retrocede 1. Pierdes: al revés.', count: 2, image: influencer },
    { id: 'camello', name: 'Camello', value: 2.9, effect: 'Roba 1 carta y luego descarta 1. Si la descartada es <= -1, avanzas 1.', count: 3, image: camello },
    { id: 'trabajador', name: 'Trabajador', value: 3, effect: 'Avanza 1 casilla.', count: 5, image: trabajador },
    { id: 'artesano', name: 'Artesano', value: 3.5, effect: 'Si estás en las casillas 0-3, avanzas 2. Si estás en la 4 o más, avanzas 1.', count: 3, image: artesano },
    { id: 'policia', name: 'Policía', value: 4, effect: 'Elige 1 jugador, ese jugador retrocede 1 casilla.', count: 4, image: policia },
    { id: 'detective', name: 'Detective', value: 4.2, effect: 'Nombra una carta. Si el rival la tiene, retrocede 2 casillas.', count: 2, image: detective },
    { id: 'guardaespaldas', name: 'Guardaespaldas', value: 4.5, effect: 'Anula el siguiente efecto negativo que te lancen. Dura 1 turno.', count: 2, image: guardaespaldas },
    { id: 'abogado', name: 'Abogado', value: 5, effect: 'Intercambia las cartas con otro jugador.', count: 3, image: abogado },
    { id: 'banquero', name: 'Banquero', value: 6, effect: 'Si la última carta jugada tenía valor 7 o más, avanzas 2 casillas.', count: 2, image: banquero },
    { id: 'musico', name: 'Músico', value: 6.5, effect: 'Roba 2 cartas y luego descarta 2 cartas.', count: 2, image: musico },
    { id: 'arlequin', name: 'Arlequín', value: 6.8, effect: 'Roba 2 cartas y luego descarta 1 carta.', count: 2, image: arlequin },
    { id: 'capo', name: 'Capo', value: 7, effect: 'Avanzas 1 casilla. Elige un jugador, el jugador elegido retrocede 1 casilla.', count: 2, image: capo },
    { id: 'futbolista', name: 'Futbolista', value: 7.2, effect: 'Descarta 1 carta para avanzar 2 casillas.', count: 2, image: futbolista },
    { id: 'politico', name: 'Político', value: 8, effect: 'Avanza 1. Elige un jugador: ese jugador descarta su mano y roba el mismo número de cartas.', count: 1, image: politico },
    { id: 'sectario', name: 'Sectario', value: 8.5, effect: 'Avanza 1. Mira la mano del rival y puedes intercambiarla con la tuya.', count: 1, image: sectario },
    { id: 'astronauta', name: 'Astronauta', value: 9, effect: 'Avanza 1. Si estás en la casilla 8 o más, robas 1 carta.', count: 1, image: astronauta },
    { id: 'arcangel', name: 'Arcángel', value: 10, effect: 'Avanza 1, roba 3 cartas y descarta 2.', count: 1, image: arcangel },
    { id: 'semidios', name: 'Semidiós', value: 11, effect: 'Avanza 1 casilla y repites turno.', count: 1, image: semidios },
    { id: 'ojotodove', name: 'Ojo que todo lo ve', value: 12, effect: 'Avanza 1 casilla y mira la mano del rival.', count: 1, image: ojo }
];
