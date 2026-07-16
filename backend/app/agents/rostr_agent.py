"""ROSTR PAL Agent — compiles onboarding data into soul.md, bios, plans, manifests."""
from app.agents.framework import BaseAgent, Tool, registry

class RostrAgent(BaseAgent):
    agent_type="rostr"; icon="◎"; color="#c9a227"
    def __init__(self):
        self.tools=[
            Tool("compile","Compile full artist package from onboarding",self._compile,{"data":"object"}),
            Tool("generate_soul","Generate soul.md from profile",self._soul,{"profile":"object"}),
            Tool("generate_bio","Generate PAL-quality bio",self._bio,{"profile":"object"}),
            Tool("generate_plan","Generate phased business roadmap",self._plan,{"goals":"list"}),
            Tool("generate_manifest","Generate agent YAML manifest",self._manifest,{"agent_type":"string"}),
        ]
    def system_prompt(self,**kw):return "ROSTR PAL Agent. Compiles artist data into packages. 5 stages: Extract→Inject→Enhance→Compile→Route."
    def _compile(self,data:dict):
        p=data.get("profile",{})
        return {"soul_md":self._soul(p),"bio":self._bio(p),"plan":self._plan(p.get("goals",[])),"manifests":{a:self._manifest(a) for a in["pro","distribution","licensing","legal","finance","manager"]}}
    def _soul(self,p:dict):
        return f"# {p.get('stage_name',p.get('first_name','Artist'))}\n# {p.get('genre','')} | {p.get('hometown','')} | {p.get('current_city','')}\n# Goals: {', '.join(p.get('goals',[]))}\n# Compiled: ROSTR PAL v1.0"
    def _bio(self,p:dict):
        n=p.get('stage_name') or p.get('first_name','Artist');g=p.get('genre','music');h=p.get('hometown','')
        return f"{n} is a {g.lower()} artist from {h}. Compiled by ROSTR PAL."
    def _plan(self,goals:list):
        return [{"phase":1,"name":"Foundation","tasks":["PRO registration","Music catalog","Online presence"]},{"phase":2,"name":"Growth","tasks":["Playlist pitching","Content calendar"]},{"phase":3,"name":"Revenue","tasks":["Sync licensing","Live shows","Merchandise"]}]
    def _manifest(self,agent_type:str):
        return {"agent_id":f"rostr-{agent_type}-001","type":agent_type,"runtime":"bedrock-deepseek-v3","temperature":0.7}

registry.add(RostrAgent())
