# Solar Swingby Simulator

3D 기반 태양계 스윙바이 시뮬레이터입니다.  
Python FastAPI 서버에서 중력장과 우주선 궤적을 계산하고, JavaScript Three.js 프론트엔드에서 계산 결과를 3D로 시각화합니다.

> 배포 링크: https://space-swingby-simulator.onrender.com

---

## 1. 프로젝트 개요

Solar Swingby Simulator는 행성의 중력을 이용한 우주선 궤적 변화를 관찰할 수 있는 웹 시뮬레이터입니다.

사용자는 발사각, 수직 각도, 초기 속도, 출발 시각, 태양계 모드를 조절할 수 있으며, 우주선이 행성의 중력장에 의해 어떻게 휘어지는지 3D 공간에서 확인할 수 있습니다.

이 프로젝트는 단순한 시각화가 아니라, Python 기반 수치 계산 엔진과 Three.js 기반 3D 렌더링을 분리한 구조로 설계되었습니다.

---

## 2. 주요 기능

- 3D 태양계 시각화
- Custom Solar System / Real Scaled Solar System 모드 지원
- 기준 날짜에 따른 행성 위치 변화
- 수평 발사각, 수직 발사각, 초기 속도 조절
- Python 기반 우주선 궤적 계산
- RK4 기반 수치 적분
- 천체 근처 adaptive substep 계산
- 예상 궤적 표시
- 실제 비행 재생
- 행성 클릭 선택
- 행성 질량 / 반지름 배율 조절
- 속도 그래프 표시 및 확대
- 시점 고정 기능
- 좌우 패널 접기 기능

---

## 3. 기술 스택

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

### Frontend

- HTML
- CSS
- JavaScript
- Three.js
- WebGL

### Deployment

- Render

---

## 4. 프로젝트 구조

```text
space-swingby-simulator/
├─ app.py
├─ requirements.txt
├─ README.md
├─ simulation/
│  ├─ __init__.py
│  ├─ models.py
│  ├─ vector.py
│  ├─ constants.py
│  ├─ planets.py
│  └─ engine.py
└─ static/
   ├─ index.html
   ├─ style.css
   └─ main.js