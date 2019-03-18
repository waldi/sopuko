(function ({ document, helpers, domHelpers }) {
  const { div, span, text } = domHelpers;
  const { shuffleArray } = helpers;

  const getColumn = (grid, x) => grid.filter((_, index) => index % 9 === x);

  const getRow = (grid, y) => grid.slice(y * 9, (y + 1) * 9);

  const getSubgrid = (grid, x, y) => grid.filter((_,i) => {
    const subgridX = Math.floor(x / 3);
    const subgridY = Math.floor(y / 3);

    const currSubgridX = Math.floor((i % 9) / 3);
    const currSubgridY = Math.floor(Math.floor((i / 9)) / 3);

    return subgridX === currSubgridX && subgridY === currSubgridY;
  });

  const isValid = (arr) => arr.length === (new Set(arr)).size;

  const isGridValid = (grid) => {
    for (let i = 0; i < 9; i++) {
      const row = getRow(grid, i);
      const column = getColumn(grid, i);

      if (!isValid(row) || !isValid(column))
        return false;
    }

    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        const subgrid = getSubgrid(grid, x * 3, y * 3);
        if (!isValid(subgrid))
          return false;
      }
    }

    return true;
  };

  const fillGrid = (grid) => {
    if (grid.length === 9*9) return grid;

    const newLen = grid.length + 1;
    const newCellX = newLen % 9;
    const newCellY = Math.floor(newLen / 9);

    const randomArray = shuffleArray([1,2,3,4,5,6,7,8,9]);

    for (let i = 0; i < 9; i++) {
      const num = randomArray[i];

      const newGrid = [...grid, num];
      if (isGridValid(newGrid)) {
        let nextGrid = fillGrid(newGrid);

        if (nextGrid) {
          return nextGrid;
        }
      }
    }

    return null;
  }

  const initGrid = () => {
    let start = Date.now();
    gameGrid = fillGrid([]);

    const numberOfInvisibles = 40;

    invisibles = [];
    for (let i = 0; i < numberOfInvisibles; i++) {
      const randomIndex = Math.floor(Math.random() * gameGrid.length);
      if (invisibles.includes(randomIndex)) {
        i--;
      } else {
        invisibles.push(randomIndex);
      }
    }

    let time = Date.now() - start;

    miniNums = (new Array(9 * 9))
      .fill()
      .map((_, i) => (new Array(9)).fill().map(() => false));
  };

  const onClick = (indexCell, indexMiniNum) => {
    if (pencilMode) {
      miniNums[indexCell][indexMiniNum] = !miniNums[indexCell][indexMiniNum];
    } else {
      const choice = indexMiniNum + 1;

      if (gameGrid[indexCell] === choice) {
        invisibles.splice(invisibles.indexOf(indexCell), 1);
      } else {
        error = 'Incorrect. Try again.';
      }
    }

    drawGrid();
  };

  const onKeyDown = ({ key }) => {
    if (key.toLowerCase() === keyPencilMode) {
      pencilMode = !pencilMode;
      drawGrid();
      return;
    }

    if (key.toLowerCase() === keyNextFocusable) {
      const possibleNums = (new Array(9))
        .fill()
        .map((_, i) => i + 1)
        .filter((num) =>
          gameGrid.filter((gridNum, index) => gridNum === num && invisibles.includes(index)).length > 0
        );

      const nextIndex = (possibleNums.indexOf(focusedNum) + 1) % possibleNums.length;
      focusedNum = possibleNums[nextIndex];

      drawGrid();
      return;
    }

    if (key > 0 && key < 10) {
      focusedNum = parseInt(key);
      drawGrid();
      return;
    }
  };

  const onKeyUp = ({ key }) => {
    if (key.toLowerCase() === keyPencilMode) {
      pencilMode = true;
      drawGrid();
      return;
    }
  };

  const drawGrid = () => {
    const sopukoElem = document.getElementById('sopuko');
    sopukoElem.innerHTML = "";

    const focusableNums = div('focusableNums', new Array(9).fill()
      .map((_, i) => i + 1)
      .map((num, i) => {
        let available = gameGrid
          .filter((gameGridNum, index) => gameGridNum === num && invisibles.includes(index))
          .length > 0;

        if (!available && focusedNum === i + 1)
          focusedNum = null;

        const selected = available && focusedNum === i + 1;
        const className = [
          'focusableNum',
          `${available ? 'focusableNum--available' : ''}`,
          `${selected ? 'focusableNum--selected' : ''}`,
        ].join(' ');
        const focusableNum = div(className, span('focusableNum-text', text(num)));

        focusableNum.addEventListener('click', () => { focusedNum = i + 1; drawGrid(); });

        return focusableNum;
      }));

    sopuko.append(focusableNums);

    const gridElem = div(`grid ${pencilMode ? 'grid--pencilMode' : ''}`);

    gameGrid.map((num, indexCell) => {
      const invisible = invisibles.includes(indexCell);
      const numElem = div('num');

      let cellClasses = ['cell'];

      if (focusedNum) {
        const miniNumSelected = invisible && miniNums[indexCell][focusedNum - 1];
        const isFocusedNum = !invisible && gameGrid[indexCell] === focusedNum;

        if (miniNumSelected || isFocusedNum) {
          cellClasses.push('focused');
        }
      }

      const cell = div(cellClasses.join(' '));

      if (invisible) {
        const miniNumsElem = div('miniNums', miniNums[indexCell]
          .map((selected, indexMiniNum) => {
            const className = `miniNum ${selected ? 'miniNum--selected' : 'miniNum--unselected'}`;
            const miniNumElem = div(className, span('', text(indexMiniNum + 1)));

            miniNumElem.addEventListener('click', () => onClick(indexCell, indexMiniNum))

            return miniNumElem;
          }));
        cell.append(miniNumsElem);
      } else {
        cell.append(div('num', text(num)));
      }

      return cell;
    }).forEach((e) => gridElem.append(e));

    sopuko.append(gridElem);

    const info = div('info');

    if (error) {
      info.append(div('error', text(error)));
      error = null;
    }

    const pencilModeElem = div(`pencilMode ${pencilMode ? 'pencilMode--on' : 'pencilMode--off'}`,
      text(`Mode: ${pencilMode ? 'Pencil' : 'Commit'}`)
    );
    pencilModeElem.addEventListener('click', () => onKeyDown({ key: keyPencilMode }));

    info.append(pencilModeElem);
    sopuko.append(info);
  }

  const keyPencilMode = 'f';
  const keyNextFocusable = 'd';

  let gameGrid = [];
  let miniNums = [];
  let invisibles;
  let error;
  let pencilMode = true;
  let focusedNum;

  initGrid();
  drawGrid();

  document.addEventListener('keydown', onKeyDown);
})({ document, helpers, domHelpers });
