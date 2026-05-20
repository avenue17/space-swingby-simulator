import gradio as gr
from ui.callbacks import (
    create_default_state,
    update_simulation,
    load_planet_settings,
    save_planet_settings,
    reset_planets,
    shift_time
)
from utils.constants import DEFAULT_LAUNCH_ANGLE, DEFAULT_LAUNCH_SPEED, DEFAULT_DURATION


def build_app():
    initial_system = create_default_state()

    initial_fig, initial_speed_fig, initial_summary = update_simulation(
        initial_system,
        DEFAULT_LAUNCH_ANGLE,
        DEFAULT_LAUNCH_SPEED,
        0.0,
        DEFAULT_DURATION,
        "top"
    )

    with gr.Blocks(title="3D Solar Swingby Simulator", theme=gr.themes.Soft()) as app:
        solar_system_state = gr.State(initial_system)

        gr.Markdown("# 3D Solar Swingby Simulator")
        gr.Markdown("발사각, 초기 속도, 행성 물리량을 조절하며 스윙바이 궤적과 속도 변화를 확인하는 웹 시뮬레이터입니다.")

        with gr.Row():
            with gr.Column(scale=1):
                gr.Markdown("## 우주선 설정")

                angle = gr.Slider(
                    0,
                    360,
                    value=DEFAULT_LAUNCH_ANGLE,
                    step=1,
                    label="발사각"
                )

                speed = gr.Slider(
                    1,
                    45,
                    value=DEFAULT_LAUNCH_SPEED,
                    step=0.5,
                    label="초기 속도"
                )

                start_time = gr.Slider(
                    0,
                    500,
                    value=0,
                    step=1,
                    label="출발 시각"
                )

                duration = gr.Slider(
                    50,
                    350,
                    value=DEFAULT_DURATION,
                    step=10,
                    label="시뮬레이션 시간"
                )

                camera_mode = gr.Radio(
                    ["top", "angled", "intro"],
                    value="top",
                    label="카메라 시점"
                )

                simulate_button = gr.Button("궤적 계산", variant="primary")

                gr.Markdown("## 시간 조작")

                with gr.Row():
                    back_1 = gr.Button("1초 전")
                    back_5 = gr.Button("5초 전")

                with gr.Row():
                    forward_1 = gr.Button("1초 후")
                    forward_5 = gr.Button("5초 후")

                gr.Markdown("## 행성 설정")

                planet_select = gr.Dropdown(
                    choices=initial_system.planet_names(),
                    value="Earth",
                    label="행성 선택"
                )

                mass_scale = gr.Slider(
                    0.1,
                    5.0,
                    value=1.0,
                    step=0.1,
                    label="질량 배율"
                )

                radius_scale = gr.Slider(
                    0.5,
                    3.0,
                    value=1.0,
                    step=0.1,
                    label="반지름 배율"
                )

                influence_scale = gr.Slider(
                    0.5,
                    3.0,
                    value=1.0,
                    step=0.1,
                    label="중력권 배율"
                )

                with gr.Row():
                    save_button = gr.Button("Save")
                    reset_button = gr.Button("태양계 초기화")

            with gr.Column(scale=3):
                solar_plot = gr.Plot(
                    value=initial_fig,
                    label="태양계 시뮬레이션"
                )

                result_text = gr.Textbox(
                    value=initial_summary,
                    label="시뮬레이션 결과",
                    lines=8
                )

                speed_plot = gr.Plot(
                    value=initial_speed_fig,
                    label="속도 그래프"
                )

        simulation_inputs = [
            solar_system_state,
            angle,
            speed,
            start_time,
            duration,
            camera_mode
        ]

        simulation_outputs = [
            solar_plot,
            speed_plot,
            result_text
        ]

        for component in [angle, speed]:
            component.change(
                fn=update_simulation,
                inputs=simulation_inputs,
                outputs=simulation_outputs
            )

        simulate_button.click(
            fn=update_simulation,
            inputs=simulation_inputs,
            outputs=simulation_outputs
        )

        camera_mode.change(
            fn=update_simulation,
            inputs=simulation_inputs,
            outputs=simulation_outputs
        )

        planet_select.change(
            fn=load_planet_settings,
            inputs=[solar_system_state, planet_select],
            outputs=[mass_scale, radius_scale, influence_scale]
        )

        save_button.click(
            fn=save_planet_settings,
            inputs=[
                solar_system_state,
                planet_select,
                mass_scale,
                radius_scale,
                influence_scale,
                angle,
                speed,
                start_time,
                duration,
                camera_mode
            ],
            outputs=[
                solar_system_state,
                solar_plot,
                speed_plot,
                result_text
            ]
        )

        reset_button.click(
            fn=reset_planets,
            inputs=simulation_inputs,
            outputs=[
                solar_system_state,
                solar_plot,
                speed_plot,
                result_text
            ]
        )

        back_1.click(
            fn=lambda system, a, s, t, d, c: shift_time(system, a, s, t, d, c, -1),
            inputs=simulation_inputs,
            outputs=[start_time, solar_plot, speed_plot, result_text]
        )

        back_5.click(
            fn=lambda system, a, s, t, d, c: shift_time(system, a, s, t, d, c, -5),
            inputs=simulation_inputs,
            outputs=[start_time, solar_plot, speed_plot, result_text]
        )

        forward_1.click(
            fn=lambda system, a, s, t, d, c: shift_time(system, a, s, t, d, c, 1),
            inputs=simulation_inputs,
            outputs=[start_time, solar_plot, speed_plot, result_text]
        )

        forward_5.click(
            fn=lambda system, a, s, t, d, c: shift_time(system, a, s, t, d, c, 5),
            inputs=simulation_inputs,
            outputs=[start_time, solar_plot, speed_plot, result_text]
        )

    return app