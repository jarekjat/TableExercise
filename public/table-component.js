export default class TableComponent extends HTMLElement {
    constructor(columns, data, summary, fillDataRules) {
        super();
        this.nullCharacter = "x"
        //this.columns = this.columns.bind(this)
        // this.columns = columns
        // this.data = data
        // this.summary = summary
        // this.fillDataRules = fillDataRules
        this.attachShadow({mode: 'open'})
         this.table = document.createElement("table")
        this.shadowRoot.append(this.table)
    }

    static get observedAttributes() {
        return ['columns','data','summary','fill-data-rules'];
    }

    attributeChangedCallback(name, oldValue, newValue) {

        switch(name){
            case 'columns':{
                this.createTableHeaders()
                break
            }
            case 'data':{
                this.insertAllData()
                this.getSummary()
                this.applyDataRules()
                break
            }
            case 'summary':{
                this.getSummary()
                break
            }
            case 'fill-data-rules':{
                this.applyDataRules()
                this.getSummary()
                break
            }
        }
        console.log(`Changed ${name} from ${oldValue} to ${newValue}`);
    }

    connectedCallback(){
        this.createTableHeaders()
        this.insertAllData()
        if(this.getAttribute('fill-data-rules')) this.applyDataRules()
        if(this.getAttribute('summary')) this.getSummary()

        let attributes = this.getAttributeNames().map(
            (attr) => {
                return {'attribute': attr, 'value': this.getAttribute(attr)}
            });

        console.table(attributes);
    }
    createTableHeaders() {
        if(!this.getAttribute('columns')) throw new Error("Columns attribute missing")
        const columns = this.getAttribute('columns').split(',')
        if(this.table.tHead) this.table.tHead.remove()
        const tableHead = this.table.createTHead()
        const row = tableHead.insertRow(0);
        this.insertRowData(row,columns)
    }
    async getTextFromFile(path){
        let response
        response = await fetch(path,{
            method: "GET",
            mode: "no-cors"
        })
        .then(res =>{
            res.text()
        }).then(v => Papa.parse(v))
        
        //.then(data => console.log(data))
        console.log(response)
        return response
        }
    insertAllData(){
        if(!this.getAttribute('data')) throw new Error("Data attribute missing")
        const allDataString = this.getAttribute('data')
        const dataSplitToRows = allDataString.split(';')
        if(this.table.tBodies[0]) this.table.tBodies[0].remove()
        const tableBody = this.table.createTBody()
        for(let i = 0;i < dataSplitToRows.length;++i){
            const dataSplitToCells = dataSplitToRows[i].split(',')
            let row = tableBody.insertRow(i)
            this.insertRowData(row,dataSplitToCells)
        }
    }
    insertRowData(row,dataArray){
        let i = 0
        dataArray.forEach(element => {
            let cell = row.insertCell(i)
            if(element === "") cell.textContent = this.nullCharacter
            else cell.textContent = element
            console.log(element)
            ++i
        });
    }
    getSummary(){
        const typesOfAggregationInString = this.getAttribute('summary')
        const typesOfAggregationInArray = typesOfAggregationInString.split(',')
        let summaryDataArray = []
        let i = 0
        typesOfAggregationInArray.forEach(element =>{
            summaryDataArray.push(this.getValueForSummarizedColumnsFooter(element,i)) 
            ++i
        })
        if(this.table.tFoot) this.table.tFoot.remove()
        const tableFooter = this.table.createTFoot()
        let row = tableFooter.insertRow(0)
        this.insertRowData(row,summaryDataArray)
    }
    getValueForSummarizedColumnsFooter(typeOfSummary, whichColumn){
        switch(typeOfSummary.toLowerCase()){
            case 'count':{
                const columnDataArray = this.getColumnData(whichColumn)
                let set = new Set()
                columnDataArray.forEach(element=>{
                    if(!this.whetherEqualsNullCharacter(element)) set.add(element)
                })
                return set.size
            }
            case 'avg':{
                const columnDataArray = this.getColumnData(whichColumn)
                return (this.getSumFromArray(columnDataArray)/columnDataArray.length).toFixed(2)
            }
            case 'sum':{
                const columnDataArray = this.getColumnData(whichColumn)
                return this.getSumFromArray(columnDataArray)
            }
            default:{
                return '-'
            }
        }
    }
    getSumFromArray(array){
        let sum = 0
        for(let i = 0;i < array.length;++i){
            console.log(array[i])
            if(this.whetherEqualsNullCharacter(array[i])) sum += 0
            else sum += +array[i]
        }
        return sum
    }
    getColumnData(whichColumn) {
        let valueForCellsInSelectedColumn = []
        for(let i = 0;i < this.table.tBodies.length;++i){
            const tableBodyRows = this.table.tBodies[i]
            for(let j = 0;j < tableBodyRows.rows.length;++j){
                valueForCellsInSelectedColumn.push(tableBodyRows.rows[j].cells[whichColumn].textContent) 
            }
        }
            return valueForCellsInSelectedColumn
    }
    applyDataRules(){
        const rulesString = this.getAttribute('fill-data-rules')
        const rulesArray = rulesString.split(',')
        for(let i = 0;i < rulesArray.length;++i){
            const regExpToMatch = new RegExp("[0-9]+=[0-9]+[+*\/-][0-9]+")
            if(!regExpToMatch.test(rulesArray[i])) throw new Error("Incorrect syntax in fill-data-rule " + rulesArray[i])
            const operationSign = rulesArray[i].charAt(3)
            const digitsArray = rulesArray[i].split(/[=+*\/-]/)
            const first = this.getColumnData(digitsArray[1]) 
            const second = this.getColumnData(digitsArray[2]) 
            let arrayToInsert = []
            let secondIterator = 0
            switch(operationSign){
                case "*":{
                  //  arrayToInsert = first.map(x =>{ ++secondIterator; return(+x * (+second[secondIterator]))  } )
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(+first[j]*(+second[j]))
                    }
                }
                case "/":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(+first[j]/(+second[j]))
                    }
                }
                case "+":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(+first[j]+(+second[j]))
                    }
                }
                case "-":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(first[j]-(+second[j]))
                    }
                }
                default:{
                    break
                }
            }
            this.changeValuesInColumn(+digitsArray[0], arrayToInsert)
        }
    }
    changeValuesInColumn(whichColumn, arrayWithData){
        let allTheRows = 0
        for(let bodiesIterator = 0;bodiesIterator < this.table.tBodies.length;++bodiesIterator){
            const column = this.table.tBodies[bodiesIterator]
            for(let rowsIterator = 0;rowsIterator < column.rows.length;++rowsIterator){
                console.log("Change values in column " + column.rows[rowsIterator].cells[whichColumn].textContent )
                if(this.whetherEqualsNullCharacter(column.rows[rowsIterator].cells[whichColumn].textContent)){
                    column.rows[rowsIterator].cells[whichColumn].textContent = arrayWithData[allTheRows]
                }
                //wywali się jak w switchu będzie default
                ++allTheRows
            }
        }
    }
    whetherEqualsNullCharacter(value){
        if(value === this.nullCharacter) return true
        else return false
    }
    disconnectedCallback() {
        console.log(`Disconnecting!`);
        this.destroy();
    }

    destroy() {
        this.innerHTML = '';
    }
}

customElements.define('table-component', TableComponent);