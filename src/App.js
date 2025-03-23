import React, { useState, useEffect } from "react";
import { Container, TextField, Button, Typography, CircularProgress, Drawer, List, ListItem, FormControlLabel, Checkbox, Table, TableHead, TableRow, TableCell, TableBody, Grid, Tooltip } from "@mui/material";
import { makeStyles } from "@mui/styles";
import Cookies from "js-cookie";
import { utils, writeFile } from "xlsx";

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100vh",
  },
  drawer: {
    width: 250,
    flexShrink: 0,
  },
  content: {
    flexGrow: 1,
    padding: "1rem",
    overflowX: "auto",
  },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
  },
  keyList: {
    width: 250
  },
  listItem: {
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
});

const App = () => {
  const classes = useStyles();
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    const storedSymbols = Cookies.get("stockSymbols");
    const storedKeys = Cookies.get("selectedKeys");
    if (storedSymbols) {
      const parsedSymbols = JSON.parse(storedSymbols);
      setSymbols(parsedSymbols);
      parsedSymbols.forEach(fetchStockData);
    }
    if (storedKeys) {
      setSelectedKeys(JSON.parse(storedKeys));
    }
  }, []);

  useEffect(() => {
      Cookies.set("stockSymbols", JSON.stringify(symbols), { expires: 7 });
  }, [symbols]);

  useEffect(() => {
    Cookies.set("selectedKeys", JSON.stringify(selectedKeys), { expires: 7 });
  }, [selectedKeys]);

  const fetchStockData = async (symbol) => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/quote/${symbol}`);
      if (!response.ok) throw new Error("Stock symbol not found");
      const result = await response.json();
      setData((prevData) => ({ ...prevData, [symbol]: result }));
      setSymbols((prevSymbols) => [...new Set([...prevSymbols, symbol])]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeySelection = (key) => {
    setSelectedKeys((prevKeys) => 
      prevKeys.includes(key) ? prevKeys.filter((k) => k !== key) : [...prevKeys, key]
    );
  };

  const exportToExcel = () => {
    const rows = symbols.map((symbol) => {
      const row = { Symbol: symbol };
      selectedKeys.forEach((key) => {
        row[key] = data[symbol]?.[key] || "N/A";
      });
      return row;
    });
    
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Stock Data");
    writeFile(workbook, "StockData.xlsx");
  };

  const constructData = (KeyValue) => {
    try{
      if(typeof KeyValue === 'string') {
        return KeyValue;
      } else if(typeof KeyValue === 'object' && Object.keys(KeyValue)?.length > 0) {
        let returnString = Object.keys(KeyValue).map(key => `${key}=${KeyValue[key]}`).join("&");
        return returnString
      }
    } catch(err) {

    }

  }

  return (
    <div className={classes.root}>
      <Drawer variant="permanent" anchor="left" className={classes.drawer}>
        <List className={classes.keyList}>
          {Object.keys(Object.values(data)[0] || {}).map((key) => (
            <ListItem key={key} button onClick={() => handleKeySelection(key)} className={classes.listItem}>
              <FormControlLabel control={<Checkbox checked={selectedKeys.includes(key)} />} label={<span>{key}</span>} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Container maxWidth="lg" className={classes.content}>
        <Typography variant="h4" gutterBottom>Stock Checker</Typography>
        <TextField
          label="Enter Stock Symbol"
          variant="outlined"
          fullWidth
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          style={{ marginBottom: "1rem" }}
        />
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <Button variant="contained" color="primary" onClick={() => fetchStockData(symbol)}>Add Symbol</Button>
          <Button variant="contained" color="secondary" onClick={exportToExcel}>Export to Excel</Button>
        </div>
        {loading && <CircularProgress style={{ marginTop: "1rem" }} />}
        {error && <Typography color="error" style={{ marginTop: "1rem" }}>{error}</Typography>}
        <div className={classes.tableContainer}>
          <Table style={{ marginTop: "1rem", minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                {selectedKeys.map((key) => <TableCell key={key}>{key}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {symbols.map((symbol) => (
                <TableRow key={symbol}>
                  <TableCell>{symbol}</TableCell>
                  {selectedKeys.map((key) => (
                    <TableCell key={key}>{data[symbol]?.[key] ? constructData(data[symbol]?.[key]) : "N/A"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Container>
    </div>
  );
};

export default App;