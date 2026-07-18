"""Business Agent — LLC/EIN registration, business formation core agent."""
from app.agents.framework import BaseAgent, Tool, registry
class BusinessAgent(BaseAgent):
    agent_type="business"; icon="🏢"; color="#06b6d2"
    def __init__(self):
        self.tools=[Tool("form_llc","File LLC formation documents",self._llc,{"state":"string","business_name":"string"}),Tool("register_ein","Register for EIN with IRS",self._ein,{}),Tool("business_checklist","Get business formation checklist by state",self._checklist,{"state":"string"}),Tool("check_status","Check registration status",self._status,{"filing_id":"string"})]
    def system_prompt(self,**kw):return "Business Agent. Core agent for business registration. Form LLC, register EIN, get state checklists."
    def _llc(self,state:str,business_name:str):return {"status":"prepared","business_name":business_name,"state":state,"filing_fee":"$150-800","docs":["Articles of Organization","Operating Agreement","EIN Application"]}
    def _ein(self):return {"status":"ready","form":"SS-4","method":"irs.gov","time":"15 min","cost":"Free"}
    def _checklist(self,state:str):return {"state":state,"steps":["Choose business structure","File with Secretary of State","Get EIN from IRS","Open business bank account","Register for state taxes"]}
    def _status(self,filing_id:str):return {"filing_id":filing_id,"status":"processing","estimated_completion":"3-5 business days"}
registry.add(BusinessAgent())
