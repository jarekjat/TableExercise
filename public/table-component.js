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
                
                break
            }
            case 'data':{

                break
            }
            case 'summary':{

                break
            }
            case 'fill-data-rules':{

                break
            }
        }
        console.log(`Changed ${name} from ${oldValue} to ${newValue}`);
    }

    connectedCallback() {
        if(!this.getAttribute('columns')){
            throw Error("Columns attribute missing")
        }
        else{
            console.log(this.getAttribute('columns'))
            this.createTableHeaders(this.getAttribute('columns').split(','))
        }
        if(!this.getAttribute('data')){
            throw Error("Data attribute missing")
        }
        else{
            this.insertAllData(this.getAttribute('data'))
        }
        if(this.getAttribute('summary')){
            this.getSummary(this.getAttribute('summary'))
        }
        if(this.getAttribute('fill-data-rules')){

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

                return '-'
            }
            case 'avg':{
                const columnDataArray = this.getColumnData(whichColumn)
                return getSumFromArray(columnDataArray)/columnDataArray.length
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
        const tableBodyRows = this.table.tBodies[0]
        let valueForCellsInSelectedColumn = []
            for(let i = 0;i < tableBodyRows.rows.length;++i){
                valueForCellsInSelectedColumn.push(tableBodyRows.rows[i].cells[whichColumn]) 
            }
            return valueForCellsInSelectedColumn
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