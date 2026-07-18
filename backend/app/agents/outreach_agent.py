"""Outreach Agent — directory pitches, CRM, targeted campaigns."""
from app.agents.framework import BaseAgent, Tool, registry
class OutreachAgent(BaseAgent):
    agent_type="outreach"; icon="📣"; color="#3b82f6"
    def __init__(self):
        self.tools=[Tool("search_contacts","Search directory for relevant contacts",self._search,{"genre":"string","category":"string?"}),Tool("generate_pitch","Generate personalized outreach pitch",self._pitch,{"contact":"string","track":"string","hook":"string?"}),Tool("track_campaign","Track outreach campaign status",self._track,{"campaign_id":"string"}),Tool("export_contacts","Export filtered contact list",self._export,{"category":"string","format":"string"})]
    def system_prompt(self,**kw):return "Outreach Agent. Pitch blogs, playlists, radio, venues. Manage contact relationships."
    def _search(self,genre:str,category:str=""):return {"matches":8,"contacts":[{"name":"IndieCurator","type":"Playlist","reach":"12K"},{"name":"Pitchfork Blog","type":"Press","reach":"500K"}]}
    def _pitch(self,contact:str,track:str,hook:str=""):return {"pitch":f"Hi {contact},\n\nI think '{track}' would resonate with your audience. {hook or 'Would love your consideration.'}\n\nStream: https://rostragent.com"}
    def _track(self,campaign_id:str):return {"sent":12,"opened":8,"replied":3,"booked":1}
    def _export(self,category:str,fmt:str="csv"):return {"url":f"https://rostragent.com/exports/contacts_{category}.csv","count":45}
registry.add(OutreachAgent())
