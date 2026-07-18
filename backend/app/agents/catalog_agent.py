"""Catalog Agent — music catalog, publishing, ISRC, splitsheets."""
from app.agents.framework import BaseAgent, Tool, registry
class CatalogAgent(BaseAgent):
    agent_type="catalog"; icon="🎵"; color="#a855f7"
    def __init__(self):
        self.tools=[Tool("upload_track","Upload track metadata to catalog",self._upload,{"title":"string","isrc":"string?","bpm":"number?","key":"string?"}),Tool("list_catalog","List all tracks in user catalog",self._list,{}),Tool("generate_splitsheet","Generate publishing splitsheet",self._splitsheet,{"track":"string","collaborators":"list","percentages":"object"}),Tool("register_isrc","Register ISRC codes for tracks",self._isrc,{"tracks":"list"})]
    def system_prompt(self,**kw):return "Catalog Agent. Manage your music catalog, generate splitsheets, register ISRC codes."
    def _upload(self,title:str,isrc:str="",bpm:float=0,key:str=""):return {"status":"uploaded","title":title,"isrc":isrc or f"US-{title[:3].upper()}-{hash(title)%100000:05d}"}
    def _list(self):return {"tracks":["Midnight in the Garden","Gold Hour","Blue"],"total":3}
    def _splitsheet(self,track:str,collaborators:list,percentages:dict):return {"track":track,"splits":{c:p for c,p in zip(collaborators,[percentages.get(c,0) for c in collaborators])},"total":sum(percentages.values())}
    def _isrc(self,tracks:list):return {"registered":len(tracks),"codes":{t:f"US-XYZ-{hash(t)%100000:05d}" for t in tracks}}
registry.add(CatalogAgent())
