"""Tutor Agent — Academy guide, projects, accountability."""
from app.agents.framework import BaseAgent, Tool, registry
class TutorAgent(BaseAgent):
    agent_type="tutor"; icon="🎓"; color="#22c55e"
    def __init__(self):
        self.tools=[Tool("recommend_course","Recommend courses based on goals",self._recommend,{"goals":"list"}),Tool("create_project","Create a learning project with milestones",self._project,{"topic":"string","duration":"string?"}),Tool("check_progress","Check course/lesson progress",self._progress,{"user_id":"string"}),Tool("explain_concept","Explain a music business concept simply",self._explain,{"concept":"string"})]
    def system_prompt(self,**kw):return "Tutor Agent. Guide artists through Academy courses. Create projects, track progress, explain concepts."
    def _recommend(self,goals:list):return {"courses":[{"title":"How to Brand Yourself","modules":7},{"title":"Music Business 101","modules":5},{"title":"Copyright Your Music","modules":7}]}
    def _project(self,topic:str,duration:str="4 weeks"):return {"project":f"Learning {topic}","milestones":["Week 1: Foundations","Week 2: Practice","Week 3: Execute","Week 4: Review"],"duration":duration}
    def _progress(self,user_id:str):return {"completed":3,"in_progress":2,"total_courses":16,"certificates":1}
    def _explain(self,concept:str):return {"concept":concept,"explanation":f"Here's {concept} in plain English: it means...","analogy":"Think of it like..."}
registry.add(TutorAgent())
