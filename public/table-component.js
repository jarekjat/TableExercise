class TableComponent extends HTMLElement {
    constructor(columns, data, summary, fillDataRules) {
        super();
        //this.columns = this.columns.bind(this)
        // this.columns = columns
        // this.data = data
        // this.summary = summary
        // this.fillDataRules = fillDataRules
        this.attachShadow({mode: 'open'})
         this.table = document.createElement("table")

        this.shadowRoot.append(this.table)
    }
    set columns(newColumns){
        this.setAttribute('columns',newColumns)
    }
    get columns(){
        return this.getAttribute('columns')
    }
    set data(newData){
        this.setAttribute('data',newData)
    }
    static get observedAttributes() {
        return ['columns','data','summary','fill-data-rules'];
    }

    attributeChangedCallback(name, oldValue, newValue) {

        switch(name){
            case 'columns':{
                console.log("attributeChangedCallback " + name)
                this.createTableHeaders(this.getAttribute('columns').split(','))
                break
            }
            case 'data':{
                console.log("attributeChangedCallback data")
                this.insertAllData(this.getAttribute('data'))
                break
            }
            case 'summary':{
                console.log("attributeChangedCallback summary")
                this.getSummary(this.getAttribute('summary'))
                break
            }
            case 'fill-data-rules':{
                console.log("attributeChangedCallback filldatarules")
                this.applyDataRules(this.getAttribute('fill-data-rules'))
                break
            }
        }
        console.log(`Changed ${name} from ${oldValue} to ${newValue}`);
    }

    connectedCallback() {
        if(!this.getAttribute('columns')){
            throw new Error("Columns attribute missing")
        }
        else{
            console.log("connectedCallback columns")
            if(this.getAttribute('columns').split(',') < 1) throw new Error("There should be at least one column in the columns attribute")
            this.createTableHeaders(this.getAttribute('columns').split(','))
        }
        if(!this.getAttribute('data')){
            throw new Error("Data attribute missing")
        }
        else{
            console.log("connectedCallback data")
            this.insertAllData(this.getAttribute('data'))
        }
        if(this.getAttribute('summary')){
            console.log("connectedCallback summary")
            this.getSummary(this.getAttribute('summary'))
        }
        if(this.getAttribute('fill-data-rules')){
            console.log("connectedCallback fill-data-rules")
            this.applyDataRules(this.getAttribute('fill-data-rules'))
        }

        let attributes = this.getAttributeNames().map(
            (attr) => {
                return {'attribute': attr, 'value': this.getAttribute(attr)}
            });

        console.table(attributes);

    }
    createTableHeaders(columns) {
        const tableHead = this.table.createTHead()
        const row = tableHead.insertRow(0);
        this.insertRowData(row,columns)
    }
    insertAllData(allDataString){
        const dataSplitToRows = allDataString.split(';')
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
            if(element === "") cell.textContent = "x"
            else cell.textContent = element
            console.log(element)
            ++i
        });
    }
    getSummary(typesOfAggregationInString){
        const typesOfAggregationInArray = typesOfAggregationInString.split(',')
        let summaryDataArray = []
        let i = 0
        typesOfAggregationInArray.forEach(element =>{
            summaryDataArray.push(this.getValueForSummarizedColumnsFooter(element,i)) 
            ++i
        })
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
                    if(element.textContent != "x") set.add(element.textContent)
                })
                return set.size
            }
            case 'avg':{
                const columnDataArray = this.getColumnData(whichColumn)
                return (getSumFromArray(columnDataArray)/columnDataArray.length).toFixed(2)
            }
            case 'sum':{
                const columnDataArray = this.getColumnData(whichColumn)
                return getSumFromArray(columnDataArray)
            }
            default:{
                return '-'
            }
        }
        function getSumFromArray(array){
            let sum = 0
            for(let i = 0;i < array.length;++i){
                console.log(array[i].textContent)
                if(array[i].innerHTML === "x") sum += 0
                else sum += +array[i].innerHTML
            }
            return sum
        }
    }
    getColumnData(whichColumn) {
        let valueForCellsInSelectedColumn = []
        for(let i = 0;i < this.table.tBodies.length;++i){
            const tableBodyRows = this.table.tBodies[i]
            for(let j = 0;j < tableBodyRows.rows.length;++j){
                valueForCellsInSelectedColumn.push(tableBodyRows.rows[j].cells[whichColumn]) 
            }
        }
            return valueForCellsInSelectedColumn
    }
    applyDataRules(rulesString){
        const rulesArray = rulesString.split(',')
        for(let i = 0;i < rulesArray.length;++i){
            const regExpToMatch = new RegExp("[0-9]")
            //if(!regExpToMatch.test(rulesArray[i])) throw new Error("Incorrect syntax in fill-data-rule no " + rulesArray[i])
            const operationSign = rulesArray[i].charAt(3)
            const digitsArray = rulesArray[i].split(/[+*\/-]/)
            const first = this.getColumnData(digitsArray[1]) 
            const second = this.getColumnData(digitsArray[2]) 
            let arrayToInsert = []
            switch(operationSign){
                case "*":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(first[j]*second[j])
                    }
                }
                case "/":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(first[j]/second[j])
                    }
                }
                case "+":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(first[j]+second[j])
                    }
                }
                case "-":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(first[j]-second[j])
                    }
                }
                default:{
                    break
                }
            }
            this.changeValuesInColumn(digitsArray[0], arrayToInsert)
        }
        
    }
    changeValuesInColumn(whichColumn, arrayWithData){
        let allTheRows = 0
        for(let bodiesIterator = 0;bodiesIterator < this.table.tBodies.length;++bodiesIterator){
            const column = this.table.tBodies[bodiesIterator]
            for(let rowsIterator = 0;rowsIterator < column.rows.length;++rowsIterator){
                column.rows[rowsIterator].cells[whichColumn] = arrayWithData[allTheRows]//wywali się jak w switchu będzie default
                ++allTheRows
            }
        }
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